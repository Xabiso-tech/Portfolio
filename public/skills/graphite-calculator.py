#!/usr/bin/env python3
"""
graphite-calculator.py — Studio Calculator for Xabiso Phendu's portfolio.

A working command-line calculator built around the numbers an artist's
studio actually needs: arithmetic for mixing and measuring, percentage
for scaling drawings up or down, and frame maths for working out the
inner opening of a mount or canvas.

Design goals, in order:
  1. Never crash on bad input. Every read is validated and re-prompted.
  2. Fail with a sentence a human can act on, not a traceback.
  3. Survive the ways a session can end: a choice, Ctrl-C, or piped
     input running out (EOF).

Run it with:  python3 graphite-calculator.py
"""

from __future__ import annotations

import sys
from dataclasses import dataclass

APP_NAME = "Studio Calculator"
VERSION = "1.0"

EXIT_CHOICES = {"0", "q", "quit", "exit"}


# ------------------------------------------------------------
# Input helpers
# ------------------------------------------------------------
def read_text(prompt: str) -> str | None:
    """Read a line. Returns None when input is exhausted or
    interrupted, so callers can shut down instead of crashing."""
    try:
        return input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        print()
        return None


def read_number(prompt: str) -> float | None:
    """Read a valid number, re-prompting until one is given.

    Rejects blanks, words, and stray characters such as '1,5' so the
    mistake is caught here rather than crashing later in the maths.
    """
    while True:
        raw = read_text(prompt)
        if raw is None:
            return None

        if raw == "":
            print("  Enter a number, or press Ctrl-C to stop.")
            continue

        try:
            return float(raw)
        except ValueError:
            print(f"  '{raw}' is not a number.")
            print("  Use plain digits, for example 42 or 3.5")


def read_choice(prompt: str, allowed: set[str]) -> str | None:
    """Read a menu choice until it matches one of `allowed`."""
    while True:
        raw = read_text(prompt)
        if raw is None:
            return None

        if raw == "":
            print("  Pick one of the listed options.")
            continue

        if raw in allowed:
            return raw

        print(f"  '{raw}' is not on the list.")


# ------------------------------------------------------------
# Formatting
# ------------------------------------------------------------
def show_number(value: float) -> str:
    """Drop a pointless trailing '.0' so 8.0 prints as 8."""
    if value != value or value in (float("inf"), float("-inf")):
        return str(value)
    if value == int(value) and abs(value) < 1e15:
        return str(int(value))
    return f"{value:.4f}".rstrip("0").rstrip(".")


@dataclass
class HistoryEntry:
    expression: str
    result: float


# ------------------------------------------------------------
# Calculations
# ------------------------------------------------------------
OPERATIONS = {
    "+": ("add", lambda a, b: a + b),
    "-": ("subtract", lambda a, b: a - b),
    "*": ("multiply", lambda a, b: a * b),
    "/": ("divide", lambda a, b: a / b),
    "%": ("modulo", lambda a, b: a % b),
    "**": ("raise to a power", lambda a, b: a ** b),
}


def do_arithmetic(history: list[HistoryEntry]) -> None:
    """Two numbers and an operator. Division and modulo by zero are
    caught explicitly so the message names the actual mistake."""
    print("\n  Operators:  +  -  *  /  %  **")

    a = read_number("  First number:  ")
    if a is None:
        return

    op = read_text("  Operator:     ")
    if op is None:
        return

    if op not in OPERATIONS:
        print(f"  '{op}' is not an operator I know. Try one of the six above.")
        return

    b = read_number("  Second number: ")
    if b is None:
        return

    name, function = OPERATIONS[op]

    # Guard the two operations that can genuinely divide by nothing.
    if op in ("/", "%") and b == 0:
        print(f"  Cannot {name} by zero. There is no answer, so nothing was calculated.")
        return

    try:
        result = function(a, b)
    except ZeroDivisionError:
        print("  Cannot divide by zero.")
        return
    except OverflowError:
        print("  That result is too large to represent.")
        return
    except ValueError as exc:
        # float() rejects NaN, and this catches other domain errors.
        print(f"  That calculation is not valid: {exc}")
        return
    except Exception as exc:  # last resort: explain, never traceback
        print(f"  Something went wrong in that calculation: {exc}")
        return

    # float("inf") can arrive via 1e308 ** 2 without raising.
    if result != result:
        print("  That is not a real number (NaN).")
        return
    if result in (float("inf"), float("-inf")):
        print("  That result is too large to represent.")
        return

    print(f"\n  {show_number(a)} {op} {show_number(b)}  =  {show_number(result)}   ({name})")
    history.append(HistoryEntry(f"{show_number(a)} {op} {show_number(b)}", result))


def do_percentage() -> None:
    """Percentage of a value, and the reverse: what percent is A of B."""
    mode = read_choice("  [1] Find a percentage of a value   [2] Find what percent A is of B:  ",
                       {"1", "2"})
    if mode is None:
        return

    if mode == "1":
        percent = read_number("  Percentage:  ")
        if percent is None:
            return
        total = read_number("  Of this value:  ")
        if total is None:
            return

        result = total * percent / 100
        print(f"\n  {show_number(percent)}% of {show_number(total)}  =  {show_number(result)}")
        return

    part = read_number("  Part:        ")
    if part is None:
        return
    whole = read_number("  Whole:       ")
    if whole is None:
        return

    if whole == 0:
        print("\n  Cannot work out a percentage of zero: any part of nothing is undefined.")
        return

    result = part / whole * 100
    print(f"\n  {show_number(part)} is {show_number(result)}% of {show_number(whole)}")


def do_frame_maths() -> None:
    """Studio frame maths: given an outer size and a border width,
    report the inner opening and the usable drawing area."""
    print("\n  The border is taken off both sides, so the inner size is")
    print("  outer minus twice the border. Sizes are in the same unit you type.")

    outer_w = read_number("  Outer width:  ")
    if outer_w is None:
        return
    outer_h = read_number("  Outer height: ")
    if outer_h is None:
        return
    border = read_number("  Border width: ")
    if border is None:
        return

    if outer_w <= 0 or outer_h <= 0:
        print("\n  Outer dimensions must be greater than zero.")
        return
    if border < 0:
        print("\n  Border width cannot be negative.")
        return

    inner_w = outer_w - 2 * border
    inner_h = outer_h - 2 * border

    print(f"\n  Outer size      {show_number(outer_w)} x {show_number(outer_h)}")
    print(f"  Border          {show_number(border)} on each edge")
    print(f"  Inner opening   {show_number(inner_w)} x {show_number(inner_h)}")

    if inner_w <= 0 or inner_h <= 0:
        print("  The border is wider than the frame, so there is no opening left.")
        return

    print(f"  Drawing area    {show_number(inner_w * inner_h)} square units")

    if inner_w == inner_h:
        print("  That opening is square.")
        return

    longer, shorter = max(inner_w, inner_h), min(inner_w, inner_h)
    print(f"  Ratio           1 : {show_number(round(shorter / longer, 3))}  (wider to narrower)")


def do_paper_ratio() -> None:
    """Common paper and canvas proportions, from a standard name to
    a width and height in millimetres."""
    paper = read_choice(
        "  [a4] [letter] [a3] [a5] [tabloid] or a custom width and height:  ",
        {"a4", "letter", "a3", "a5", "tabloid", "custom"},
    )
    if paper is None:
        return

    standard = {
        "a3": (297.0, 420.0),
        "a4": (210.0, 297.0),
        "a5": (148.0, 210.0),
        "letter": (215.9, 279.4),
        "tabloid": (279.4, 431.8),
    }

    if paper == "custom":
        width = read_number("  Width (mm):  ")
        if width is None:
            return
        height = read_number("  Height (mm): ")
        if height is None:
            return
        if width <= 0 or height <= 0:
            print("\n  Width and height must both be greater than zero.")
            return
        name = "Custom"
    else:
        width, height = standard[paper]
        name = paper.upper()

    if width == height:
        ratio = "1 : 1, square"
    else:
        longer, shorter = max(width, height), min(width, height)
        ratio = f"1 : {show_number(round(shorter / longer, 3))}"

    area = width * height
    print(f"\n  {name}")
    print(f"  Size            {show_number(width)} x {show_number(height)} mm")
    print(f"  Ratio           {ratio}")
    print(f"  Area            {show_number(area)} square mm")


def show_history(history: list[HistoryEntry]) -> None:
    if not history:
        print("\n  Nothing calculated yet this session.")
        return

    print(f"\n  This session ({len(history)}):\n")
    for number, entry in enumerate(history, start=1):
        print(f"    {number:>2}.  {entry.expression:<24} =  {show_number(entry.result)}")
    print()


# ------------------------------------------------------------
# Menu
# ------------------------------------------------------------
MENU = f"""
  {APP_NAME} {VERSION}

    1  Arithmetic          two numbers and an operator
    2  Percentage          a percentage of a value, or what percent A is of B
    3  Frame maths         inner opening and drawing area from a border
    4  Paper and canvas    standard sizes and their ratios
    5  History             everything calculated this session
    0  Quit

"""


def main() -> int:
    history: list[HistoryEntry] = []

    print(f"\n  {APP_NAME} — graphite, charcoal, and numbers that behave.")

    while True:
        print(MENU)

        choice = read_choice("  Choose:  ", {"0", "1", "2", "3", "4", "5"} | EXIT_CHOICES)
        if choice is None:
            print("  Input closed. Stopping.\n")
            return 0

        if choice in EXIT_CHOICES:
            print(f"  Closing the studio. {len(history)} calculation(s) this session.\n")
            return 0

        try:
            if choice == "1":
                do_arithmetic(history)
            elif choice == "2":
                do_percentage()
            elif choice == "3":
                do_frame_maths()
            elif choice == "4":
                do_paper_ratio()
            elif choice == "5":
                show_history(history)
        except (KeyboardInterrupt, EOFError):
            # A stray Ctrl-C inside a calculation should return to the
            # menu, not throw the whole session away.
            print("\n  Cancelled that one. Back to the menu.")
            continue
        except Exception as exc:
            # Whatever happens, the user gets a sentence, not a stack trace.
            print(f"\n  Unexpected problem: {exc}")
            print("  Returning to the menu.\n")
            continue


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        # Ctrl-C at the very top level, before main() catches anything.
        print("\n  Interrupted. Bye.\n")
        sys.exit(0)
