"""Read-only checks of approved inputs/tasks and T001 evidence; writes an evidence report only."""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
FEATURE = ROOT / "specs/001-system-specification"
EVIDENCE = ROOT / "docs/verification"

def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

authorization = read_json(FEATURE / "implementation-authorization.json")
preserved = []
for item in authorization["input_fingerprints"]:
    if item["path"] == "specs/001-system-specification/tasks.md":
        continue  # Only execution status/checkboxes may change; definitions checked below.
    assert sha(ROOT / item["path"]) == item["sha256"], item["path"]
    preserved.append(item["path"])

catalog = read_json(FEATURE / "tasks-catalog.json")
tasks = catalog["tasks"]
by_key = {t["key"]: t for t in tasks}
order = catalog["execution_order"]
positions = {task_id: i for i, task_id in enumerate(order)}
text = (FEATURE / "tasks.md").read_text(encoding="utf-8-sig")
lines = re.findall(r"^- \[([ xX])\] (T\d{3}) (.+)$", text, re.M)
assert len(tasks) == len(lines) == len(order) == len(set(order)) == 186
assert {task_id for _, task_id, _ in lines} == set(order)
done = {task_id for check, task_id, _ in lines if check.lower() == "x"}
for task in tasks:
    line = next(body for _, task_id, body in lines if task_id == task["id"])
    assert task["description"] in line, task["id"]
    for key in task["dependencies"]:
        dep = by_key[key]["id"]
        assert positions[dep] < positions[task["id"]], (task["id"], dep)
        if task["id"] in done:
            assert dep in done, (task["id"], dep)

result = read_json(EVIDENCE / "t001-build-result.json")
assert result["exit_code"] == 0
build_log = (EVIDENCE / "t001-build.log").read_text(encoding="utf-8-sig")
assert "BUILD SUCCESS" in build_log and "DependencyConvergence passed" in build_log
suite_path = ROOT / "backend/target/surefire-reports/TEST-com.adc.BuildSmokeTest.xml"
suite = ET.parse(suite_path).getroot()
assert int(suite.attrib["tests"]) == 3
assert all(int(suite.attrib[field]) == 0 for field in ("failures", "errors", "skipped"))
tree = (EVIDENCE / "t001-dependency-tree.txt").read_text(encoding="utf-8-sig")
versions = {
    "org.springframework.boot:spring-boot": "4.1.2",
    "org.springframework:spring-core": "7.0.10",
    "org.springframework.security:spring-security-core": "7.1.2",
    "org.mybatis.spring.boot:mybatis-spring-boot-starter": "4.1.0",
    "org.mybatis:mybatis-spring": "4.1.0",
    "org.mybatis:mybatis": "3.5.19",
    "com.mysql:mysql-connector-j": "9.7.0",
    "org.flywaydb:flyway-core": "12.4.0",
    "org.flywaydb:flyway-mysql": "12.4.0",
    "org.junit.jupiter:junit-jupiter": "6.0.3",
    "org.testcontainers:testcontainers": "2.0.5",
}
for artifact, version in versions.items():
    assert f"{artifact}:jar:{version}:" in tree, artifact
ET.parse(EVIDENCE / "t001-effective-pom.xml")
jar = ROOT / "backend/target/adc-backend-0.1.0-SNAPSHOT.jar"
with zipfile.ZipFile(jar) as archive:
    names = archive.namelist()
    assert "BOOT-INF/classes/com/adc/AdcApplication.class" in names
    assert not any("BuildProbe" in n or "BuildSmoke" in n for n in names)

files = [p for p in (ROOT / "backend").rglob("*") if p.is_file()
         and "target" not in p.relative_to(ROOT / "backend").parts]
files += [jar, suite_path, FEATURE / "tasks.md", EVIDENCE / "t001-build-result.json",
          EVIDENCE / "t001-effective-pom.xml", EVIDENCE / "t001-dependency-tree.txt",
          EVIDENCE / "t001-runtime-image.json"]
report = {
    "checked_at": datetime.now(timezone.utc).isoformat(),
    "approved_inputs_preserved": preserved,
    "task_count": 186, "completed_tasks": sorted(done),
    "task_definitions_unchanged": True,
    "dependency_references_exist": True, "execution_order_is_topological": True,
    "completed_tasks_have_completed_dependencies": True,
    "test_count": 3, "test_failures": 0, "test_errors": 0, "test_skipped": 0,
    "versions": versions, "test_mapper_not_in_production_jar": True,
    "real_database_tested": False, "container_runtime_tested": False,
    "fingerprints": [{"path": str(p.relative_to(ROOT)).replace("\\", "/"), "sha256": sha(p)} for p in files],
}
(EVIDENCE / "t001-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print(json.dumps({"status": "PASS", "tasks": 186, "completed": sorted(done), "tests": 3,
                  "protected_inputs": len(preserved)}, ensure_ascii=True))
