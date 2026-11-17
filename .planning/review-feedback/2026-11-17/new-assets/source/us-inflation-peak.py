# /// script
# requires-python = ">=3.12"
# dependencies = ["matplotlib==3.10.*"]
# ///
"""Two-point US CPI-U comparison for the us-inflation-peak card.
Run: uv run source/us-inflation-peak.py <out.png>. Data: BLS series CUUR0000SA0, checked 2026-11-17."""
import sys
import matplotlib

matplotlib.use("Agg")  # no display, bundled DejaVu font only: nothing remote
import matplotlib.pyplot as plt

plt.rcParams["text.parse_math"] = False  # "$" is a dollar sign here

START = ("September 2013", "GTA 5 release month", 234.149)
END = ("October 2026", "latest published month", 337.511)
rise = END[2] / START[2] - 1
assert f"{rise:.1%}" == "44.1%" and f"{100 * (1 + rise):.2f}" == "144.14"

fig, ax = plt.subplots(figsize=(16, 9), dpi=100)
fig.patch.set_facecolor("white")
bars = ax.bar([0, 1], [START[2], END[2]], width=0.55, color=["#8a8f98", "#c2410c"])
for x, (month, note, value) in enumerate((START, END)):
    ax.text(x, value + 6, f"{value:.3f}", ha="center", va="bottom", fontsize=26, weight="bold")
    ax.text(x, -14, month, ha="center", va="top", fontsize=24, weight="bold")
    ax.text(x, -58, note, ha="center", va="top", fontsize=19, color="#444")
ax.text(0.5, 445, f"+{rise:.1%}", ha="center", va="bottom", fontsize=54, weight="bold", color="#c2410c")
ax.text(0.5, 412, f"What cost $100 in September 2013 cost ${100 * (1 + rise):.2f} in October 2026", ha="center", va="bottom", fontsize=24)
ax.set_xlim(-0.6, 1.6)
ax.set_ylim(0, 500)
ax.axis("off")
fig.suptitle("US consumer prices since GTA 5", fontsize=34, weight="bold", x=0.05, ha="left", y=0.96)
fig.text(0.05, 0.875, "CPI-U, all items, US city average, not seasonally adjusted (index 1982-84 = 100)",
         fontsize=18, color="#444")
fig.text(0.05, 0.03, "Source: US Bureau of Labor Statistics, series CUUR0000SA0. "
         "October 2026 is the latest published month (checked 17 Nov 2026).", fontsize=15, color="#444")
fig.subplots_adjust(left=0.05, right=0.95, top=0.82, bottom=0.2)
fig.savefig(sys.argv[1], facecolor="white")
