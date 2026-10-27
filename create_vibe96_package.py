import os
import shutil
import zipfile
import re

ROOT = "/Users/Naim/projects/renewradar"
STAGING_DIR = "/Users/Naim/.gemini/antigravity-ide/brain/43b17a2c-2071-4cd3-89e5-3d086e57eca6/scratch/staging"
PKG_DIR = os.path.join(STAGING_DIR, "RenewRadar")
ZIP_OUT = os.path.join(ROOT, "RenewRadar_vibe96.zip")

if os.path.exists(STAGING_DIR):
    shutil.rmtree(STAGING_DIR)
os.makedirs(PKG_DIR, exist_ok=True)

# 1. Root files
root_files = [
    "README.md",
    "HowToSetup.md",
    "CLAUDE.md",
    "CHANGELOG.md",
    "LICENSE-NOTE.md",
    "docker-compose.yml",
    ".env.example"
]
for rf in root_files:
    src_file = os.path.join(ROOT, rf)
    if os.path.exists(src_file):
        shutil.copy2(src_file, os.path.join(PKG_DIR, rf))

# 2. Database files
db_target = os.path.join(PKG_DIR, "database")
os.makedirs(db_target, exist_ok=True)
shutil.copy2(os.path.join(ROOT, "database", "schema.sql"), os.path.join(db_target, "schema.sql"))
shutil.copy2(os.path.join(ROOT, "database", "seed.sql"), os.path.join(db_target, "seed.sql"))

# 3. Docs
docs_target = os.path.join(PKG_DIR, "docs")
os.makedirs(docs_target, exist_ok=True)
shutil.copy2(os.path.join(ROOT, "docs", "API.md"), os.path.join(docs_target, "API.md"))

# 4. Node Express Project
backend_target = os.path.join(PKG_DIR, "Node Express Project")
os.makedirs(backend_target, exist_ok=True)

for item in os.listdir(os.path.join(ROOT, "backend")):
    if item in ["node_modules", ".git", ".env", ".DS_Store"]:
        continue
    src_path = os.path.join(ROOT, "backend", item)
    dst_path = os.path.join(backend_target, item)
    if os.path.isdir(src_path):
        shutil.copytree(src_path, dst_path, ignore=shutil.ignore_patterns("node_modules", ".git", ".DS_Store"))
    else:
        shutil.copy2(src_path, dst_path)

# 5. React Vite Project
frontend_target = os.path.join(PKG_DIR, "React Vite Project")
os.makedirs(frontend_target, exist_ok=True)

for item in os.listdir(os.path.join(ROOT, "frontend")):
    if item in ["node_modules", "dist", ".git", ".DS_Store"] or item.startswith(".env"):
        continue
    src_path = os.path.join(ROOT, "frontend", item)
    dst_path = os.path.join(frontend_target, item)
    if os.path.isdir(src_path):
        shutil.copytree(src_path, dst_path, ignore=shutil.ignore_patterns("node_modules", "dist", ".git", ".DS_Store"))
    else:
        shutil.copy2(src_path, dst_path)

# Create compatibility symlinks backend and frontend in the package
try:
    os.symlink("Node Express Project", os.path.join(PKG_DIR, "backend"))
    os.symlink("React Vite Project", os.path.join(PKG_DIR, "frontend"))
except Exception as e:
    pass

print("Staging completed. Running strict Vibe96 audit checks...")

errors = []

# Audit Check 1: No real credentials or fallback literals in code
auth_file = os.path.join(PKG_DIR, "Node Express Project", "src", "services", "authService.js")
with open(auth_file, 'r') as fh:
    auth_src = fh.read()
    if "JWT_SECRET ||" in auth_src or "process.env.JWT_SECRET ||" in auth_src:
        errors.append("authService.js still contains a fallback for JWT_SECRET")
    if "ADMIN_PASSWORD ||" in auth_src or "process.env.ADMIN_PASSWORD ||" in auth_src:
        errors.append("authService.js still contains a fallback for ADMIN_PASSWORD")

# Audit Check 2: Docker-compose check
docker_file = os.path.join(PKG_DIR, "docker-compose.yml")
with open(docker_file, 'r') as fh:
    docker_src = fh.read()
    for bad in ["rootpassword", "renewradar_password", "StrongPassword"]:
        if bad in docker_src:
            errors.append(f"docker-compose.yml contains hardcoded password: {bad}")
    if "version:" in docker_src:
        errors.append("docker-compose.yml still has obsolete 'version:' key")
    if "0.0.0.0:3306" in docker_src or ('"3306:3306"' in docker_src):
        errors.append("docker-compose.yml exposes port 3306 publicly")

# Audit Check 3: Check documentation for leaked personal paths or Telegram-style token formats
doc_files = ["README.md", "HowToSetup.md", "CLAUDE.md", "docs/API.md"]
for df in doc_files:
    fp = os.path.join(PKG_DIR, df)
    if os.path.exists(fp):
        with open(fp, 'r') as fh:
            content = fh.read()
            if "/Users/" in content:
                errors.append(f"{df} contains absolute path '/Users/'")
            if re.search(r'\b\d{8,10}:[a-zA-Z0-9_-]{20,}\b', content):
                errors.append(f"{df} contains Telegram-style bot token format")
            if "StrongPassword123" in content:
                errors.append(f"{df} contains sample password 'StrongPassword123'")

# Audit Check 4: Ensure no real .env is included
real_env_files = []
for root, dirs, files in os.walk(PKG_DIR):
    for f in files:
        if f == '.env' or (f.startswith('.env.') and not f.endswith('.example')):
            real_env_files.append(os.path.relpath(os.path.join(root, f), PKG_DIR))

if real_env_files:
    errors.append(f"Real .env files found in archive: {real_env_files}")

# Audit Check 5: Lockfiles
if not os.path.exists(os.path.join(PKG_DIR, "Node Express Project", "package-lock.json")):
    errors.append("Node Express Project/package-lock.json missing")
if not os.path.exists(os.path.join(PKG_DIR, "React Vite Project", "package-lock.json")):
    errors.append("React Vite Project/package-lock.json missing")

# Audit Check 6: Excluded folders
for root, dirs, files in os.walk(PKG_DIR):
    for d in dirs:
        if d in ["node_modules", "dist", "build", ".git"]:
            errors.append(f"Forbidden directory '{d}' found at {os.path.join(root, d)}")

# Audit Check 7: No duplicate schema
if os.path.exists(os.path.join(PKG_DIR, "Node Express Project", "src", "models", "schema.sql")):
    errors.append("Duplicate schema.sql found in Node Express Project/src/models/schema.sql")

if errors:
    print("❌ VIBE96 AUDIT CHECKS FAILED:")
    for err in errors:
        print(f"  - {err}")
    exit(1)
else:
    print("✅ ALL VIBE96 AUDIT CHECKS PASSED (100% CLEAN & VERIFIED)!")

# Create ZIP
print(f"Generating ZIP archive: {ZIP_OUT}...")
if os.path.exists(ZIP_OUT):
    os.remove(ZIP_OUT)

with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(STAGING_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, STAGING_DIR)
            zipf.write(full_path, rel_path)

size_mb = os.path.getsize(ZIP_OUT) / (1024 * 1024)
print(f"🎉 Successfully created {ZIP_OUT} ({size_mb:.2f} MB)")
