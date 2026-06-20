
Action: file_editor create /app/backend/server.py --file-text "from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / \".env\")

import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from emergentintegrations.llm.chat import LlmChat, UserMessage

# ----------------------- Setup -----------------------
logging.basicConfig(level=logging.INFO, format=\"%(asctime)s - %(name)s - %(levelname)s - %(message)s\")
logger = logging.getLogger(\"sap-hub\")

mongo_url = os.environ[\"MONGO_URL\"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ[\"DB_NAME\"]]

JWT_ALGORITHM = \"HS256\"
JWT_SECRET = os.environ[\"JWT_SECRET\"]
EMERGENT_LLM_KEY = os.environ.get(\"EMERGENT_LLM_KEY\", \"\")

app = FastAPI(title=\"TCS SAP Hub API\")
api = APIRouter(prefix=\"/api\")


# ----------------------- Helpers -----------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(\"utf-8\"), bcrypt.gensalt()).decode(\"utf-8\")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(\"utf-8\"), hashed.encode(\"utf-8\"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        \"sub\": user_id,
        \"email\": email,
        \"exp\": datetime.now(timezone.utc) + timedelta(hours=12),
        \"type\": \"access\",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=\"access_token\",
        value=token,
        httponly=True,
        secure=True,
        samesite=\"none\",
        max_age=43200,
        path=\"/\",
    )


def public_user(user: dict) -> dict:
    return {
        \"id\": user[\"id\"],
        \"email\": user[\"email\"],
        \"name\": user.get(\"name\", \"\"),
        \"role\": user.get(\"role\", \"associate\"),
        \"avatar\": user.get(\"avatar\"),
        \"skills\": user.get(\"skills\", []),
        \"created_at\": user.get(\"created_at\"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get(\"access_token\")
    if not token:
        auth = request.headers.get(\"Authorization\", \"\")
        if auth.startswith(\"Bearer \"):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail=\"Not authenticated\")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get(\"type\") != \"access\":
            raise HTTPException(status_code=401, detail=\"Invalid token type\")
        user = await db.users.find_one({\"id\": payload[\"sub\"]}, {\"_id\": 0})
        if not user:
            raise HTTPException(status_code=401, detail=\"User not found\")
        user.pop(\"password_hash\", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail=\"Token expired\")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail=\"Invalid token\")


# ----------------------- Models -----------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProjectIn(BaseModel):
    name: str
    description: str = \"\"
    module: str = \"SAP\"  # SAP module name
    deadline: Optional[str] = None
    status: Literal[\"planning\", \"active\", \"on_hold\", \"completed\"] = \"active\"


class TaskIn(BaseModel):
    title: str
    description: str = \"\"
    project_id: str
    assignee_email: Optional[str] = None
    status: Literal[\"todo\", \"in_progress\", \"review\", \"done\"] = \"todo\"
    priority: Literal[\"low\", \"medium\", \"high\", \"critical\"] = \"medium\"
    due_date: Optional[str] = None
    tags: List[str] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee_email: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None


class CommentIn(BaseModel):
    body: str


class RepoIn(BaseModel):
    name: str
    url: str
    language: str = \"ABAP\"
    description: str = \"\"


class ChallengeIn(BaseModel):
    title: str
    language: Literal[\"c\", \"cpp\", \"linux\"]
    difficulty: Literal[\"easy\", \"medium\", \"hard\"] = \"easy\"
    description: str
    starter_code: str = \"\"
    sample_input: str = \"\"
    sample_output: str = \"\"
    points: int = 10


class SubmissionIn(BaseModel):
    challenge_id: str
    code: str


# ----------------------- Auth Routes -----------------------
@api.post(\"/auth/register\")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({\"email\": email})
    if existing:
        raise HTTPException(status_code=400, detail=\"Email already registered\")
    user_doc = {
        \"id\": str(uuid.uuid4()),
        \"email\": email,
        \"name\": payload.name,
        \"password_hash\": hash_password(payload.password),
        \"role\": \"associate\",
        \"skills\": [],
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc[\"id\"], email)
    set_auth_cookie(response, token)
    return {\"user\": public_user(user_doc), \"token\": token}


@api.post(\"/auth/login\")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({\"email\": email}, {\"_id\": 0})
    if not user or not verify_password(payload.password, user[\"password_hash\"]):
        raise HTTPException(status_code=401, detail=\"Invalid email or password\")
    token = create_access_token(user[\"id\"], email)
    set_auth_cookie(response, token)
    return {\"user\": public_user(user), \"token\": token}


@api.post(\"/auth/logout\")
async def logout(response: Response):
    response.delete_cookie(\"access_token\", path=\"/\")
    return {\"ok\": True}


@api.get(\"/auth/me\")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ----------------------- Users -----------------------
@api.get(\"/users\")
async def list_users(_: dict = Depends(get_current_user)):
    users = await db.users.find({}, {\"_id\": 0, \"password_hash\": 0}).to_list(500)
    return [public_user(u) for u in users]


# ----------------------- Projects -----------------------
@api.get(\"/projects\")
async def list_projects(_: dict = Depends(get_current_user)):
    items = await db.projects.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return items


@api.post(\"/projects\")
async def create_project(payload: ProjectIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc.update(
        {
            \"id\": str(uuid.uuid4()),
            \"created_by\": user[\"email\"],
            \"created_at\": datetime.now(timezone.utc).isoformat(),
        }
    )
    await db.projects.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.get(\"/projects/{project_id}\")
async def get_project(project_id: str, _: dict = Depends(get_current_user)):
    p = await db.projects.find_one({\"id\": project_id}, {\"_id\": 0})
    if not p:
        raise HTTPException(404, \"Project not found\")
    return p


# ----------------------- Tasks -----------------------
@api.get(\"/tasks\")
async def list_tasks(project_id: Optional[str] = None, _: dict = Depends(get_current_user)):
    q = {\"project_id\": project_id} if project_id else {}
    items = await db.tasks.find(q, {\"_id\": 0}).sort(\"created_at\", -1).to_list(1000)
    return items


@api.post(\"/tasks\")
async def create_task(payload: TaskIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc.update(
        {
            \"id\": str(uuid.uuid4()),
            \"created_by\": user[\"email\"],
            \"created_at\": datetime.now(timezone.utc).isoformat(),
            \"comments\": [],
        }
    )
    await db.tasks.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.patch(\"/tasks/{task_id}\")
async def update_task(task_id: str, payload: TaskUpdate, _: dict = Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, \"No fields to update\")
    res = await db.tasks.update_one({\"id\": task_id}, {\"$set\": updates})
    if res.matched_count == 0:
        raise HTTPException(404, \"Task not found\")
    t = await db.tasks.find_one({\"id\": task_id}, {\"_id\": 0})
    return t


@api.delete(\"/tasks/{task_id}\")
async def delete_task(task_id: str, _: dict = Depends(get_current_user)):
    res = await db.tasks.delete_one({\"id\": task_id})
    if res.deleted_count == 0:
        raise HTTPException(404, \"Task not found\")
    return {\"ok\": True}


@api.post(\"/tasks/{task_id}/comments\")
async def add_comment(task_id: str, payload: CommentIn, user: dict = Depends(get_current_user)):
    comment = {
        \"id\": str(uuid.uuid4()),
        \"author_email\": user[\"email\"],
        \"author_name\": user.get(\"name\", user[\"email\"]),
        \"body\": payload.body,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.tasks.update_one({\"id\": task_id}, {\"$push\": {\"comments\": comment}})
    if res.matched_count == 0:
        raise HTTPException(404, \"Task not found\")
    return comment


# ----------------------- GitHub Repos -----------------------
@api.get(\"/repos\")
async def list_repos(_: dict = Depends(get_current_user)):
    items = await db.repos.find({}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(200)
    return items


@api.post(\"/repos\")
async def add_repo(payload: RepoIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc.update(
        {
            \"id\": str(uuid.uuid4()),
            \"added_by\": user[\"email\"],
            \"created_at\": datetime.now(timezone.utc).isoformat(),
            \"stars\": 0,
            \"commits\": [],
        }
    )
    await db.repos.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.delete(\"/repos/{repo_id}\")
async def delete_repo(repo_id: str, _: dict = Depends(get_current_user)):
    await db.repos.delete_one({\"id\": repo_id})
    return {\"ok\": True}


# ----------------------- Learning Portal -----------------------
@api.get(\"/challenges\")
async def list_challenges(language: Optional[str] = None, _: dict = Depends(get_current_user)):
    q = {\"language\": language} if language else {}
    items = await db.challenges.find(q, {\"_id\": 0}).to_list(500)
    return items


@api.get(\"/challenges/{challenge_id}\")
async def get_challenge(challenge_id: str, _: dict = Depends(get_current_user)):
    c = await db.challenges.find_one({\"id\": challenge_id}, {\"_id\": 0})
    if not c:
        raise HTTPException(404, \"Challenge not found\")
    return c


@api.post(\"/challenges\")
async def create_challenge(payload: ChallengeIn, user: dict = Depends(get_current_user)):
    if user.get(\"role\") != \"admin\":
        raise HTTPException(403, \"Admin only\")
    doc = payload.model_dump()
    doc.update({\"id\": str(uuid.uuid4()), \"created_at\": datetime.now(timezone.utc).isoformat()})
    await db.challenges.insert_one(doc)
    doc.pop(\"_id\", None)
    return doc


@api.post(\"/submissions\")
async def submit_code(payload: SubmissionIn, user: dict = Depends(get_current_user)):
    challenge = await db.challenges.find_one({\"id\": payload.challenge_id}, {\"_id\": 0})
    if not challenge:
        raise HTTPException(404, \"Challenge not found\")

    # AI-grade with Claude
    system = (
        \"You are an expert programming instructor evaluating student code submissions for \"
        \"C, C++, and Linux shell scripting challenges. You give a numeric score (0-100), \"
        \"concise feedback, and 2-3 improvement suggestions. ALWAYS respond ONLY with strict JSON: \"
        '{\"score\": <0-100 int>, \"verdict\": \"<one short phrase>\", \"feedback\": \"<2-3 sentences>\", '
        '\"suggestions\": [\"...\", \"...\"], \"passed\": <true|false>}'
    )
    prompt = (
        f\"Language: {challenge['language']}\n\"
        f\"Challenge title: {challenge['title']}\n\"
        f\"Problem:\n{challenge['description']}\n\n\"
        f\"Sample input: {challenge.get('sample_input', '')}\n\"
        f\"Expected output: {challenge.get('sample_output', '')}\n\n\"
        f\"Student submission:\n```\n{payload.code}\n```\n\n\"
        \"Evaluate correctness, style, and efficiency. Reply with JSON only.\"
    )

    score = 0
    verdict = \"Not evaluated\"
    feedback = \"AI evaluation unavailable.\"
    suggestions: List[str] = []
    passed = False

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f\"eval-{user['id']}-{payload.challenge_id}\",
            system_message=system,
        ).with_model(\"anthropic\", \"claude-sonnet-4-5-20250929\")
        result = await chat.send_message(UserMessage(text=prompt))
        import json, re
        raw = result if isinstance(result, str) else str(result)
        m = re.search(r\"\{.*\}\", raw, re.DOTALL)
        if m:
            parsed = json.loads(m.group(0))
            score = int(parsed.get(\"score\", 0))
            verdict = str(parsed.get(\"verdict\", \"Reviewed\"))
            feedback = str(parsed.get(\"feedback\", \"\"))
            suggestions = list(parsed.get(\"suggestions\", []))[:4]
            passed = bool(parsed.get(\"passed\", score >= 70))
    except Exception as e:
        logger.exception(\"AI eval failed: %s\", e)
        feedback = f\"AI evaluation error: {e}\"

    submission = {
        \"id\": str(uuid.uuid4()),
        \"challenge_id\": payload.challenge_id,
        \"user_id\": user[\"id\"],
        \"user_email\": user[\"email\"],
        \"code\": payload.code,
        \"score\": score,
        \"verdict\": verdict,
        \"feedback\": feedback,
        \"suggestions\": suggestions,
        \"passed\": passed,
        \"points_earned\": challenge[\"points\"] if passed else 0,
        \"created_at\": datetime.now(timezone.utc).isoformat(),
    }
    await db.submissions.insert_one(submission)
    submission.pop(\"_id\", None)
    return submission


@api.get(\"/submissions/me\")
async def my_submissions(user: dict = Depends(get_current_user)):
    items = await db.submissions.find({\"user_id\": user[\"id\"]}, {\"_id\": 0}).sort(\"created_at\", -1).to_list(500)
    return items


# ----------------------- Dashboard Stats -----------------------
@api.get(\"/stats/dashboard\")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({\"status\": \"active\"})
    total_tasks = await db.tasks.count_documents({})
    open_tasks = await db.tasks.count_documents({\"status\": {\"$ne\": \"done\"}})
    my_tasks = await db.tasks.count_documents({\"assignee_email\": user[\"email\"], \"status\": {\"$ne\": \"done\"}})
    total_challenges = await db.challenges.count_documents({})
    my_submissions_count = await db.submissions.count_documents({\"user_id\": user[\"id\"]})

    # Aggregate user points
    points_cursor = db.submissions.aggregate(
        [{\"$match\": {\"user_id\": user[\"id\"], \"passed\": True}}, {\"$group\": {\"_id\": None, \"total\": {\"$sum\": \"$points_earned\"}}}]
    )
    points_doc = await points_cursor.to_list(1)
    my_points = points_doc[0][\"total\"] if points_doc else 0

    # Task status breakdown
    pipeline = [{\"$group\": {\"_id\": \"$status\", \"count\": {\"$sum\": 1}}}]
    status_counts = {d[\"_id\"]: d[\"count\"] async for d in db.tasks.aggregate(pipeline)}

    return {
        \"total_projects\": total_projects,
        \"active_projects\": active_projects,
        \"total_tasks\": total_tasks,
        \"open_tasks\": open_tasks,
        \"my_open_tasks\": my_tasks,
        \"total_challenges\": total_challenges,
        \"my_submissions\": my_submissions_count,
        \"my_points\": my_points,
        \"task_status\": status_counts,
    }


@api.get(\"/stats/leaderboard\")
async def leaderboard(_: dict = Depends(get_current_user)):
    pipeline = [
        {\"$match\": {\"passed\": True}},
        {\"$group\": {\"_id\": \"$user_email\", \"points\": {\"$sum\": \"$points_earned\"}, \"solved\": {\"$sum\": 1}}},
        {\"$sort\": {\"points\": -1}},
        {\"$limit\": 10},
    ]
    rows = [d async for d in db.submissions.aggregate(pipeline)]
    return [{\"email\": r[\"_id\"], \"points\": r[\"points\"], \"solved\": r[\"solved\"]} for r in rows]


# ----------------------- Seeding -----------------------
async def seed_data():
    # Indexes
    await db.users.create_index(\"email\", unique=True)
    await db.projects.create_index(\"id\", unique=True)
    await db.tasks.create_index(\"id\", unique=True)
    await db.challenges.create_index(\"id\", unique=True)
    await db.repos.create_index(\"id\", unique=True)

    admin_email = os.environ.get(\"ADMIN_EMAIL\", \"admin@tcs.com\").lower()
    admin_password = os.environ.get(\"ADMIN_PASSWORD\", \"Admin@123\")
    admin = await db.users.find_one({\"email\": admin_email})
    if not admin:
        await db.users.insert_one(
            {
                \"id\": str(uuid.uuid4()),
                \"email\": admin_email,
                \"name\": \"Priya Iyer\",
                \"password_hash\": hash_password(admin_password),
                \"role\": \"admin\",
                \"skills\": [\"SAP ABAP\", \"Fiori\", \"S/4HANA\"],
                \"created_at\": datetime.now(timezone.utc).isoformat(),
            }
        )
    else:
        if not verify_password(admin_password, admin[\"password_hash\"]):
            await db.users.update_one({\"email\": admin_email}, {\"$set\": {\"password_hash\": hash_password(admin_password)}})

    # Demo associate
    demo_email = \"associate@tcs.com\"
    if not await db.users.find_one({\"email\": demo_email}):
        await db.users.insert_one(
            {
                \"id\": str(uuid.uuid4()),
                \"email\": demo_email,
                \"name\": \"Arjun Mehta\",
                \"password_hash\": hash_password(\"Associate@123\"),
                \"role\": \"associate\",
                \"skills\": [\"C\", \"Linux\", \"ABAP\"],
                \"created_at\": datetime.now(timezone.utc).isoformat(),
            }
        )

    # Projects
    if await db.projects.count_documents({}) == 0:
        projects = [
            {
                \"id\": str(uuid.uuid4()),
                \"name\": \"S/4HANA Migration - Retail Client\",
                \"description\": \"Migrate legacy ECC system to S/4HANA for a global retail customer.\",
                \"module\": \"S/4HANA\",
                \"deadline\": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
                \"status\": \"active\",
                \"created_by\": admin_email,
                \"created_at\": datetime.now(timezone.utc).isoformat(),
            },
            {
                \"id\": str(uuid.uuid4()),
                \"name\": \"Fiori App Catalog Rollout\",
                \"description\": \"Deploy a curated SAP Fiori app catalog across HR and Finance verticals.\",
                \"module\": \"Fiori\",
                \"deadline\": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
                \"status\": \"active\",
                \"created_by\": admin_email,
                \"created_at\": datetime.now(timezone.utc).isoformat(),
            },
            {
                \"id\": str(uuid.uuid4()),
                \"name\": \"ABAP Code Refactor Sprint\",
                \"description\": \"Refactor 18k lines of ABAP for performance and modern syntax adoption.\",
                \"module\": \"ABAP\",
                \"deadline\": (datetime.now(timezone.utc) + timedelta(days=60)).isoformat(),
                \"status\": \"planning\",
                \"created_by\": admin_email,
                \"created_at\": datetime.now(timezone.utc).isoformat(),
            },
        ]
        await db.projects.insert_many(projects)

        # Tasks
        proj_ids = [p[\"id\"] for p in projects]
        tasks = []
        seed_tasks = [
            (\"Inventory legacy ABAP custom code\", \"high\", \"in_progress\", admin_email, 0),
            (\"Set up S/4HANA sandbox tenant\", \"critical\", \"todo\", admin_email, 0),
            (\"Data archival policy review\", \"medium\", \"review\", demo_email, 0),
            (\"Design Fiori HR home tile\", \"medium\", \"in_progress\", demo_email, 1),
            (\"Catalog publishing pipeline\", \"high\", \"todo\", admin_email, 1),
            (\"User access roles matrix\", \"low\", \"done\", demo_email, 1),
            (\"Identify long-running ABAP reports\", \"high\", \"todo\", demo_email, 2),
            (\"Migrate WRITE statements to NEW syntax\", \"medium\", \"todo\", admin_email, 2),
        ]
        for title, prio, status, assignee, pidx in seed_tasks:
            tasks.append(
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": title,
                    \"description\": f\"Auto-seeded task: {title}.\",
                    \"project_id\": proj_ids[pidx],
                    \"assignee_email\": assignee,
                    \"status\": status,
                    \"priority\": prio,
                    \"due_date\": (datetime.now(timezone.utc) + timedelta(days=7 + pidx * 5)).isoformat(),
                    \"tags\": [\"seed\"],
                    \"created_by\": admin_email,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                    \"comments\": [],
                }
            )
        await db.tasks.insert_many(tasks)

    # Repos
    if await db.repos.count_documents({}) == 0:
        await db.repos.insert_many(
            [
                {
                    \"id\": str(uuid.uuid4()),
                    \"name\": \"tcs-sap-migration-tools\",
                    \"url\": \"https://github.com/tcs-sap/migration-tools\",
                    \"language\": \"ABAP\",
                    \"description\": \"Internal scripts for S/4HANA migration automation.\",
                    \"added_by\": admin_email,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                    \"stars\": 142,
                    \"commits\": [
                        {\"hash\": \"a1b2c3d\", \"message\": \"Add data validator for ECC tables\", \"author\": \"priya.iyer\", \"date\": \"2 hours ago\"},
                        {\"hash\": \"f9e8d7c\", \"message\": \"Fix BAPI wrapper for delta loads\", \"author\": \"rahul.k\", \"date\": \"yesterday\"},
                        {\"hash\": \"8d4e2a1\", \"message\": \"Refactor ALE config parser\", \"author\": \"neha.s\", \"date\": \"3 days ago\"},
                    ],
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"name\": \"sap-fiori-launchpad-themes\",
                    \"url\": \"https://github.com/tcs-sap/fiori-themes\",
                    \"language\": \"TypeScript\",
                    \"description\": \"Custom Fiori launchpad themes for TCS client deployments.\",
                    \"added_by\": admin_email,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                    \"stars\": 67,
                    \"commits\": [
                        {\"hash\": \"2e7f4b8\", \"message\": \"Add dark theme variant for finance vertical\", \"author\": \"arjun.m\", \"date\": \"5 hours ago\"},
                        {\"hash\": \"9c3a1d6\", \"message\": \"Bump UI5 version\", \"author\": \"priya.iyer\", \"date\": \"2 days ago\"},
                    ],
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"name\": \"abap-linter\",
                    \"url\": \"https://github.com/tcs-sap/abap-linter\",
                    \"language\": \"ABAP\",
                    \"description\": \"Static analysis rules tuned for SAP refactor sprints.\",
                    \"added_by\": admin_email,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                    \"stars\": 213,
                    \"commits\": [
                        {\"hash\": \"5b6e9a3\", \"message\": \"Rule R042: warn on nested SELECTs\", \"author\": \"kavya.t\", \"date\": \"yesterday\"},
                        {\"hash\": \"1f8d2c7\", \"message\": \"Performance pass on AST walker\", \"author\": \"arjun.m\", \"date\": \"4 days ago\"},
                    ],
                },
            ]
        )

    # Challenges
    if await db.challenges.count_documents({}) == 0:
        await db.challenges.insert_many(
            [
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"Reverse a string in C\",
                    \"language\": \"c\",
                    \"difficulty\": \"easy\",
                    \"description\": \"Write a C program that reads a string and prints its reverse. Use only standard C library functions.\",
                    \"starter_code\": \"#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char s[256];\n    // read s and print reversed\n    return 0;\n}\n\",
                    \"sample_input\": \"hello\",
                    \"sample_output\": \"olleh\",
                    \"points\": 10,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"Pointer-based array sum\",
                    \"language\": \"c\",
                    \"difficulty\": \"medium\",
                    \"description\": \"Compute the sum of an integer array using pointer arithmetic only (no array indexing).\",
                    \"starter_code\": \"#include <stdio.h>\n\nint sum(int *a, int n) {\n    // your code\n    return 0;\n}\n\",
                    \"sample_input\": \"5\n1 2 3 4 5\",
                    \"sample_output\": \"15\",
                    \"points\": 20,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"Class with constructor in C++\",
                    \"language\": \"cpp\",
                    \"difficulty\": \"easy\",
                    \"description\": \"Create a class `Rectangle` with private width/height, a constructor, and an `area()` method.\",
                    \"starter_code\": \"#include <iostream>\nusing namespace std;\n\nclass Rectangle {\n    // your code\n};\n\nint main() {\n    Rectangle r(4, 5);\n    cout << r.area() << endl;\n    return 0;\n}\n\",
                    \"sample_input\": \"\",
                    \"sample_output\": \"20\",
                    \"points\": 10,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"STL: word frequency\",
                    \"language\": \"cpp\",
                    \"difficulty\": \"medium\",
                    \"description\": \"Read a paragraph from stdin, output each unique word with its frequency, sorted alphabetically. Use STL `map`.\",
                    \"starter_code\": \"#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code\n    return 0;\n}\n\",
                    \"sample_input\": \"sap sap fiori abap fiori\",
                    \"sample_output\": \"abap 1\nfiori 2\nsap 2\",
                    \"points\": 25,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"Count files in a directory\",
                    \"language\": \"linux\",
                    \"difficulty\": \"easy\",
                    \"description\": \"Write a shell script that prints the number of regular files in a given directory passed as argument.\",
                    \"starter_code\": \"#!/bin/bash\n# usage: ./count.sh <directory>\n\",
                    \"sample_input\": \"./count.sh /etc\",
                    \"sample_output\": \"(numeric file count)\",
                    \"points\": 10,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
                {
                    \"id\": str(uuid.uuid4()),
                    \"title\": \"Tail-and-grep log monitor\",
                    \"language\": \"linux\",
                    \"difficulty\": \"hard\",
                    \"description\": \"Write a shell script that continuously tails /var/log/app.log and prints only lines matching ERROR or WARN, prefixed with a timestamp.\",
                    \"starter_code\": \"#!/bin/bash\n\",
                    \"sample_input\": \"tail input stream\",
                    \"sample_output\": \"[2026-02-12 09:00:01] ERROR Something failed\",
                    \"points\": 30,
                    \"created_at\": datetime.now(timezone.utc).isoformat(),
                },
            ]
        )


# ----------------------- App wiring -----------------------
app.include_router(api)

cors_origins = [o.strip() for o in os.environ.get(\"CORS_ORIGINS\", \"\").split(\",\") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins or [\"*\"],
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)


@app.on_event(\"startup\")
async def on_startup():
    await seed_data()
    logger.info(\"SAP Hub API ready. Seeded data verified.\")


@app.on_event(\"shutdown\")
async def on_shutdown():
    client.close()
"
Observation: Overwrite successful: /app/backend/server.py