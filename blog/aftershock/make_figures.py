"""Figures for the blog post "Aftershock: a reverb made from earthquakes".

Everything is computed from the plugin repo (github.com/sofiavallejob/aftershock):
  pack/catalog.json                    event and station metadata, band levels, seismic RT60
  plugin/data/aftershock_pack.bin.gz   the waveforms the plugin uses (Z, N, E at 20 Hz)
  plugin/data/land.json                coastlines (Natural Earth)
  aftershock_render                    IRs, built with CMake in plugin/

Usage:
  # render the 80 IRs once (same settings as docs/SCIENCE.md section 5)
  mkdir irs && cd irs && /path/to/aftershock_render . --length 3 --spectrum 1 --contrast 1 --grit 0 --damping 0
  python3 make_figures.py --repo /path/to/aftershock --irs /path/to/irs --fonts /path/to/IBMPlexSans-ttf-folder

Needs numpy, scipy, matplotlib. Writes img/fig*.png at 2x and prints the numbers used in the text.
"""
import argparse, glob, gzip, json, os, struct
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.lines import Line2D
from matplotlib.patches import Patch, FancyBboxPatch
from scipy.io import wavfile
from scipy.signal import spectrogram

ap = argparse.ArgumentParser()
ap.add_argument("--repo", required=True)
ap.add_argument("--irs", required=True)
ap.add_argument("--fonts", default="")
ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "img"))
A = ap.parse_args()
os.makedirs(A.out, exist_ok=True)

# ---------- style: light plots, to sit on the white figure panels of the site ----------
for f in glob.glob(os.path.join(A.fonts, "*.ttf")) + [os.path.join(A.repo, "plugin/data/PixelifySans.ttf")]:
    font_manager.fontManager.addfont(f)
TITLE = font_manager.FontProperties(fname=os.path.join(A.repo, "plugin/data/PixelifySans.ttf"), size=15)
INK, MUTED, GRID, BG = "#1e2235", "#6b6880", "#e6e4ee", "#ffffff"
plt.rcParams.update({
    "font.family": "IBM Plex Sans", "font.size": 10.5, "text.color": INK,
    "axes.edgecolor": "#c9c6d6", "axes.labelcolor": INK, "axes.titlecolor": INK,
    "xtick.color": MUTED, "ytick.color": MUTED, "axes.grid": True, "grid.color": GRID,
    "grid.linewidth": 0.8, "axes.spines.top": False, "axes.spines.right": False,
    "figure.facecolor": BG, "axes.facecolor": BG, "savefig.facecolor": BG, "legend.frameon": False,
})
# the plugin's accents, deepened so they hold up on white
SET_COL = {"interface": "#2a8c99", "intraslab": "#4a68c0", "deep": "#8e4fc2", "collision": "#cf7a2a",
           "strikeslip": "#c94d6c", "europe": "#3a9268", "oceanic": "#2f9fd6", "craton": "#a88a14",
           "volcanic": "#d4402b"}
DIST_COL = {"near": "#2a8c99", "regional": "#cf7a2a", "tele": "#8e4fc2"}
DIST_LABEL = {"near": "near (< 330 km)", "regional": "regional (3 to 15°)", "tele": "far (20 to 60°)"}

def save(fig, name):
    fig.savefig(os.path.join(A.out, name), dpi=200, bbox_inches="tight", pad_inches=0.18)
    plt.close(fig)
    print("wrote", name)

def title(ax, text, x=0.0):
    ax.text(x, 1.04, text, transform=ax.transAxes, fontproperties=TITLE, color=INK, ha="left", va="bottom")

# ---------- data ----------
cat = json.load(open(os.path.join(A.repo, "pack/catalog.json")))
raw = gzip.open(os.path.join(A.repo, "plugin/data/aftershock_pack.bin.gz")).read()
assert raw[:8] == b"AFTSHK01"
hlen = struct.unpack("<I", raw[8:12])[0]
blob = raw[12 + hlen:]
SETTINGS = cat["settings"]
BANDS = np.array(cat["bands_hz"])
events = {e["id"]: e for e in cat["events"]}
recs = [(e, s) for e in cat["events"] for s in e["stations"]]
print(f"{len(events)} events, {len(recs)} recordings")

def trace(st):
    a = np.frombuffer(blob, dtype="<i2", count=st["n"] * 3, offset=st["offset"]).reshape(st["n"], 3)
    t = st["t0"] + np.arange(st["n"]) / st["fs"]
    return t, a.astype(float) * st["scale"]

def station(eid, band):
    return next(s for s in events[eid]["stations"] if s["band"] == band)

# ---------- 1. world map ----------
land = json.load(open(os.path.join(A.repo, "plugin/data/land.json")))
fig, ax = plt.subplots(figsize=(10, 5.6))
for poly in land:
    xy = np.array(poly).reshape(-1, 2)
    if np.abs(np.diff(xy[:, 0])).max() > 180:
        # polygons that wrap the dateline: unwrap, then draw at both copies; Antarctica is off the map anyway
        if xy[:, 1].max() < -55:
            continue
        xy = xy.copy(); xy[:, 0] = np.degrees(np.unwrap(np.radians(xy[:, 0])))
        for sh in (-360, 360):
            ax.fill(xy[:, 0] + sh, xy[:, 1], color="#eeedf3", lw=0.4, ec="#d8d6e2", zorder=0)
    ax.fill(xy[:, 0], xy[:, 1], color="#eeedf3", lw=0.4, ec="#d8d6e2", zorder=0)
for e, s in recs:
    lon2 = s["lon"]
    if abs(lon2 - e["lon"]) > 180:  # draw the short way round, split at the edge
        lon2 = lon2 - 360 * np.sign(lon2 - e["lon"])
    ax.plot([e["lon"], lon2], [e["lat"], s["lat"]], color=SET_COL[e["setting"]], lw=0.9, alpha=0.45, zorder=1)
    ax.scatter(s["lon"], s["lat"], marker="^", s=16, color="white", ec=SET_COL[e["setting"]], lw=0.9, zorder=2)
for e in cat["events"]:
    ax.scatter(e["lon"], e["lat"], s=18 + (e["mag"] - 5) ** 2.2 * 9, color=SET_COL[e["setting"]], ec="white", lw=0.8, zorder=3)
ax.set_xlim(-180, 180); ax.set_ylim(-60, 80); ax.set_aspect("equal")
ax.grid(False); ax.set_xticks([]); ax.set_yticks([])
for sp in ax.spines.values(): sp.set_visible(False)
handles = [Line2D([], [], marker="o", ls="", color=SET_COL[k], markersize=7, label=v) for k, v in SETTINGS.items()]
handles.append(Line2D([], [], marker="^", ls="", color="white", markeredgecolor=MUTED, markersize=7, label="station"))
ax.legend(handles=handles, loc="upper center", bbox_to_anchor=(0.5, -0.02), ncol=4, fontsize=9.5, handletextpad=0.3, columnspacing=1.4)
title(ax, "35 earthquakes, 80 recordings")
save(fig, "fig1_map.png")

# ---------- 2. one seismogram ----------
ev = events["petrinja2020"]; st = station("petrinja2020", "regional")
t, x = trace(st)
end = st["t0"] + st["n"] / st["fs"]
ws = max(st["t0"], st["P"] - 1.0)
k = (end - ws) / 3.0
print(f"Petrinja G.SSB: {st['dist_km']:.0f} km, window {ws:.0f} to {end:.0f} s, k = {k:.0f}x for 3 s")
fig, axs = plt.subplots(3, 1, figsize=(10, 5.8), sharex=True)
for i, (ax, comp) in enumerate(zip(axs, ["Z  vertical", "N  north (left)", "E  east (right)"])):
    peak = np.abs(x).max()
    ax.axvspan(ws, end, color="#e4f58c", alpha=0.28, lw=0, zorder=0)
    ax.plot(t, x[:, i] / peak, color=INK, lw=0.5, zorder=2)
    ax.set_ylim(-1.05, 1.05); ax.set_yticks([])
    ax.text(0.005, 0.86, comp, transform=ax.transAxes, fontsize=10, color=MUTED)
    for tm, lab, col in [(st["P"], "P", "#2a8c99"), (st["S"], "S", "#c94d6c"), (st["R"], "surface", "#cf7a2a")]:
        ax.axvline(tm, color=col, lw=1.2, zorder=3)
        if i == 0:
            ax.text(tm + 6, 1.12, lab, color=col, fontsize=10, fontweight="medium", va="bottom")
    ax.grid(axis="y", visible=False)
axs[0].text(end - 6, -0.92, f"reverb window: {end - ws:.0f} s of ground motion  →  3 s of reverb  (k ≈ {k:.0f}x)",
            ha="right", fontsize=9.5, color=INK)
axs[-1].set_xlabel("seconds after the earthquake")
axs[-1].set_xlim(st["t0"], end)
axs[0].text(0, 1.38, f"Petrinja M{ev['mag']}, 2020, at G.SSB ({st['dist_km']:.0f} km)", transform=axs[0].transAxes,
            fontproperties=TITLE, color=INK)
fig.subplots_adjust(hspace=0.12)
save(fig, "fig2_seismogram.png")

# ---------- 3. mapping diagram ----------
audio = np.geomspace(120, 12000, 10)
fig, ax = plt.subplots(figsize=(10, 5.4))
ax.set_xlim(0, 10); ax.set_ylim(-2.0, 10.2); ax.axis("off")
ramp = plt.get_cmap("viridis")(np.linspace(0.1, 0.85, 10))
def fmt(f):
    return f"{f/1000:.1f} kHz" if f >= 1000 else (f"{f:.0f} Hz" if f >= 10 else f"{f:.2g} Hz")
for i in range(10):
    y = i
    ax.add_patch(FancyBboxPatch((0.5, y - 0.36), 2.2, 0.72, boxstyle="round,pad=0,rounding_size=0.12", fc=ramp[i], ec="none", alpha=0.9))
    ax.add_patch(FancyBboxPatch((7.3, y - 0.36), 2.2, 0.72, boxstyle="round,pad=0,rounding_size=0.12", fc=ramp[i], ec="none", alpha=0.9))
    tc = INK if i >= 7 else "white"
    ax.text(1.6, y, fmt(BANDS[i]), ha="center", va="center", color=tc, fontsize=10.5, fontweight="medium")
    ax.text(8.4, y, fmt(audio[i]), ha="center", va="center", color=tc, fontsize=10.5, fontweight="medium")
    ax.annotate("", xy=(7.22, y), xytext=(2.78, y), arrowprops=dict(arrowstyle="-|>", color=ramp[i], lw=1.3, alpha=0.7))
ax.text(1.6, 9.75, "ground motion", ha="center", va="bottom", fontproperties=TITLE)
ax.text(8.4, 9.75, "reverb", ha="center", va="bottom", fontproperties=TITLE)
ax.text(5.0, 4.55, "envelope of each band\ndrives band-passed noise", ha="center", va="center", fontsize=10, color=MUTED,
        bbox=dict(fc="white", ec="none", pad=4))
ax.text(1.6, -1.45, f"{end - ws:.0f} s", ha="center", va="center", fontsize=13, fontweight="semibold")
ax.text(8.4, -1.45, "3 s", ha="center", va="center", fontsize=13, fontweight="semibold")
ax.annotate("", xy=(7.6, -1.45), xytext=(2.4, -1.45), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.4))
ax.text(5.0, -1.1, f"time squeezed by k = window / reverb length ≈ {k:.0f}x", ha="center", va="bottom", fontsize=10, color=INK)
save(fig, "fig3_mapping.png")

# ---------- 4. seismic RT60 per band, one earthquake at three distances ----------
fig, ax = plt.subplots(figsize=(10, 4.8))
for band in ["near", "regional", "tele"]:
    s = station("petrinja2020", band)
    f = np.array([b["f"] for b in s["bands"]])
    r = np.array([b["rt60"] if b["rt60"] else np.nan for b in s["bands"]], float)
    fit = np.array([b["fit_db"] or 0 for b in s["bands"]])
    col = DIST_COL[band]
    ax.plot(f, r, color=col, lw=1.6, alpha=0.8, label=f"{DIST_LABEL[band]}: {s['net']}.{s['sta']}, {s['dist_km']:.0f} km")
    good = fit >= 20
    ax.scatter(f[good], r[good], color=col, s=34, zorder=3, ec="white", lw=0.8)
    ax.scatter(f[~good], r[~good], color="white", s=34, zorder=3, ec=col, lw=1.4)
ax.set_xscale("log"); ax.set_yscale("log")
ax.set_xticks(BANDS); ax.set_xticklabels([f"{b:g}" for b in BANDS]); ax.minorticks_off()
ax.set_xlabel("seismic band (Hz)"); ax.set_ylabel("seismic RT60 (s)")
h, l = ax.get_legend_handles_labels()
h.append(Line2D([], [], marker="o", ls="", color="white", markeredgecolor=MUTED, markersize=6.5))
l.append("hollow: fitted over less than 20 dB")
ax.legend(h, l, loc="upper left", bbox_to_anchor=(1.01, 1.0), fontsize=9.5)
title(ax, "Petrinja 2020: how long each band rings")
save(fig, "fig4_rt60.png")

# ---------- IR measurements ----------
def load_ir(path):
    sr, y = wavfile.read(path)
    y = y.astype(float)
    return sr, y if y.ndim == 2 else y[:, None]

def centroid(sr, y):
    # magnitude-weighted spectral centroid (the usual definition, as in docs/SCIENCE.md)
    M = np.sqrt((np.abs(np.fft.rfft(y, axis=0)) ** 2).sum(axis=1))
    f = np.fft.rfftfreq(y.shape[0], 1 / sr)
    return float((f * M).sum() / M.sum())

def t20(sr, y):
    e = (y ** 2).sum(axis=1)
    sch = np.cumsum(e[::-1])[::-1]
    db = 10 * np.log10(sch / sch[0] + 1e-30)
    i5, i25 = np.argmax(db <= -5), np.argmax(db <= -25)
    if i25 <= i5:
        return np.nan
    tt = np.arange(len(db)) / sr
    slope = np.polyfit(tt[i5:i25], db[i5:i25], 1)[0]
    return -60.0 / slope

rows = []
for e, s in recs:
    p = os.path.join(A.irs, f"{e['id']}_{s['band']}_{s['net']}.{s['sta']}.wav")
    sr, y = load_ir(p)
    rows.append(dict(id=e["id"], setting=e["setting"], band=s["band"], dist=s["dist_km"], mag=e["mag"],
                     c=centroid(sr, y), t20=t20(sr, y)))
print("\nmedians on the rendered IRs:")
for b in ["near", "regional", "tele"]:
    g = [r for r in rows if r["band"] == b]
    print(f"  {b:9s} n={len(g):2d}  centroid {np.median([r['c'] for r in g]):6.0f} Hz  T20 {np.nanmedian([r['t20'] for r in g]):.1f} s")
for sset in SETTINGS:
    g = [r for r in rows if r["setting"] == sset and r["band"] != "tele"]
    if g:
        print(f"  {sset:10s} (near+regional) n={len(g)}  centroid {np.median([r['c'] for r in g]):6.0f} Hz  T20 {np.nanmedian([r['t20'] for r in g]):.1f} s")

# ---------- 5. spectrograms of six earthquakes ----------
six = ["petrinja2020", "kilauea2018", "etna2018", "botswana2017", "tohoku2011", "okhotsk2013"]
fig, axs = plt.subplots(2, 3, figsize=(10, 6.0), sharex=True, sharey=True)
for ax, eid in zip(axs.flat, six):
    e = events[eid]
    s = next((x for x in e["stations"] if x["band"] == "near"), e["stations"][0])
    sr, y = load_ir(os.path.join(A.irs, f"{eid}_{s['band']}_{s['net']}.{s['sta']}.wav"))
    f, tt, S = spectrogram(y.mean(axis=1), sr, nperseg=2048, noverlap=1536)
    S = 10 * np.log10(S / S.max() + 1e-12)
    ax.pcolormesh(tt, f, S, vmin=-70, vmax=0, cmap="magma", shading="auto", rasterized=True)
    ax.set_yscale("log"); ax.set_ylim(80, 16000); ax.grid(False)
    ax.set_yticks([100, 1000, 10000]); ax.set_yticklabels(["100", "1k", "10k"])
    ax.set_title(f"{e['name'].split(',')[0]} M{e['mag']}\n{SETTINGS[e['setting']].split(' (')[0].lower()}, {s['band']}, {s['dist_km']:.0f} km",
                 fontsize=9.5, loc="left", color=INK, pad=5)
for ax in axs[1]: ax.set_xlabel("seconds")
for ax in axs[:, 0]: ax.set_ylabel("Hz")
fig.text(0.0, 1.0, "Six earthquakes as 3 s impulse responses", fontproperties=TITLE, va="bottom")
fig.tight_layout(h_pad=1.4)
save(fig, "fig5_spectrograms.png")

# ---------- 6. centroid vs distance ----------
fig, ax = plt.subplots(figsize=(10, 5.0))
for r in rows:
    ax.scatter(r["dist"], r["c"], color=SET_COL[r["setting"]], s=34, ec="white", lw=0.7, zorder=3)
for b, (lo, hi) in {"near": (25, 330), "regional": (330, 1670), "tele": (2200, 6700)}.items():
    m = np.median([r["c"] for r in rows if r["band"] == b])
    ax.plot([lo, hi], [m, m], color=INK, lw=2, zorder=4, solid_capstyle="butt")
    ax.text(np.sqrt(lo * hi), m * 1.06, f"median {m:.0f} Hz", ha="center", va="bottom", fontsize=9.5, color=INK, zorder=5,
            bbox=dict(fc="white", ec="none", pad=1.5, alpha=0.85))
ax.set_xscale("log"); ax.set_yscale("log")
ax.set_xticks([30, 100, 300, 1000, 3000, 10000]); ax.set_xticklabels(["30", "100", "300", "1000", "3000", "10000"])
ax.set_yticks([500, 1000, 2000, 4000]); ax.set_yticklabels(["500", "1000", "2000", "4000"]); ax.minorticks_off()
ax.set_xlim(20, 8000)
ax.set_xlabel("epicentral distance (km)"); ax.set_ylabel("spectral centroid of the IR (Hz)")
handles = [Line2D([], [], marker="o", ls="", color=SET_COL[k], markersize=7, label=v) for k, v in SETTINGS.items()]
ax.legend(handles=handles, loc="upper left", bbox_to_anchor=(1.01, 1.0), fontsize=9.5)
title(ax, "Farther away, darker reverb")
save(fig, "fig6_centroid.png")
