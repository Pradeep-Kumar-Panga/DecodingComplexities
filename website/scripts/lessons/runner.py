# Runs a lesson's code blocks in order in one shared namespace and returns each block's printed output as JSON.
import builtins
import contextlib
import importlib
import io
import json
import os
import re
import sys
import tempfile

blocks = json.load(sys.stdin)
os.chdir(tempfile.mkdtemp())
sys.path.insert(0, os.getcwd())
namespace = {"__name__": "__main__"}
results = []

for index, block in enumerate(blocks):
    answers = iter(block["stdin"].split("\n")) if block.get("stdin") is not None else iter(())

    def fake_input(prompt=""):
        try:
            answer = next(answers)
        except StopIteration:
            raise EOFError("lesson block asked for more input than it provided")
        print(prompt + answer)
        return answer

    builtins.input = fake_input
    importlib.invalidate_caches()
    buffer = io.StringIO()
    error = None
    with contextlib.redirect_stdout(buffer):
        try:
            exec(compile(block["code"], "<lesson>", "exec"), namespace)
        except BaseException as exc:
            error = exc

    output = buffer.getvalue()
    expected = block.get("error")
    if error is not None:
        name = type(error).__name__
        message = error.msg if isinstance(error, SyntaxError) else str(error)
        if expected != name:
            print(f"Block {index + 1} raised {name}: {message}", file=sys.stderr)
            print(block["code"], file=sys.stderr)
            sys.exit(1)
        output += f"{name}: {message}\n"
    elif expected:
        print(f"Block {index + 1} was expected to raise {expected} but ran cleanly", file=sys.stderr)
        sys.exit(1)

    # Object addresses change on every run; keep the shape, pin the digits.
    output = re.sub(r"0x[0-9a-fA-F]{6,}", "0x7f3a2c1b4d90", output)
    results.append(output)

json.dump(results, sys.stdout)
