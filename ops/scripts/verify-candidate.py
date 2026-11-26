#!/usr/bin/env python3
"""Read-only verification of a new isolated release; never starts or cleans a stack."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('manifest', type=Path)
parser.add_argument('--files-only', action='store_true')
args = parser.parse_args()
manifest_path = args.manifest.resolve(strict=True)
root = manifest_path.parent
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
if manifest['status'] != 'verified-isolated-candidate-not-production-approval' or manifest['contains_secrets'] is not False:
    raise SystemExit('Unexpected candidate classification')

def check_file(relative, expected):
    target = (root / relative).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise SystemExit('Candidate path escaped its new release directory')
    if not re.fullmatch(r'[0-9a-f]{64}', expected):
        raise SystemExit('Invalid expected fingerprint')
    digest = hashlib.file_digest(target.open('rb'), 'sha256').hexdigest()
    if digest != expected:
        raise SystemExit('Candidate fingerprint mismatch: ' + relative)

check_file(manifest['archive']['file'], manifest['archive']['sha256'])
for entry in manifest['files']:
    check_file(entry['path'], entry['sha256'])
if not args.files_only:
    for image in manifest['images']:
        if not re.fullmatch(r'(adc/(backend|admin):[A-Za-z0-9._-]+|mysql@sha256:[0-9a-f]{64})', image['reference']):
            raise SystemExit('Unexpected image reference')
        response = subprocess.run(['sudo', '-n', 'docker', 'image', 'inspect', image['reference']], text=True, capture_output=True)
        if response.returncode:
            # docker load can preserve an untagged image ID but lose its registry reference.
            # Fallback is ONLY the exact approved MySQL content ID, not a mutable tag/version.
            approved = 'sha256:72c368d898861f3b3a07af0e6d690400f44f048799ed46822783d9224cc2c86d'
            if image['reference'] != 'mysql@' + approved or image['id'] != approved:
                raise SystemExit('Loaded image reference is missing: ' + image['reference'])
            response = subprocess.run(['sudo', '-n', 'docker', 'image', 'inspect', approved], text=True, capture_output=True, check=True)
        observed = json.loads(response.stdout)[0]
        if observed['Id'] != image['id'] or observed['Os'] != 'linux' or observed['Architecture'] != 'amd64':
            raise SystemExit('Loaded image identity or platform differs: ' + image['reference'])
print(json.dumps({'files_match': True, 'images_match': not args.files_only, 'production_started': False}))
