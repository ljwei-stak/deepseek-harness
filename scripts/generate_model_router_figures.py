"""Generate reproducible figures for the Model Router thesis.

The price records in this file are a reference snapshot transcribed from the
user-provided screenshots on 2026-08-22. They are illustrative values for
experiments, not a claim about a provider's current invoice or a secret key.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib import font_manager, patches
import pandas as pd
import seaborn as sns


REFERENCE_DATE = "2026-08-22"
USD_TO_CNY = 7.2


def price_rows() -> pd.DataFrame:
    """Return the structured price snapshot used by all generated figures."""
    rows = [
        # model, provider family, currency, input, output, cache read, note
        ("DeepSeek V4 Flash", "DeepSeek", "CNY", 1.5, 4.5, 0.05, "闲时/≤输入区间"),
        ("DeepSeek V4 Pro", "DeepSeek", "CNY", 4.5, 13.5, 0.15, "闲时/≤输入区间"),
        ("MiMo V2.5 Pro", "MiMo", "CNY", 3.0, 6.0, 0.025, "截图有效价"),
        ("MiMo V2.5", "MiMo", "CNY", 1.0, 2.0, 0.02, "截图有效价"),
        ("Qwen3.7 Plus", "Qwen", "CNY", 1.6, 6.4, 0.32, "≤256K"),
        ("Qwen3.7 Max", "Qwen", "CNY", 6.0, 18.0, 1.2, "截图有效价"),
        ("Qwen3.7 Flash", "Qwen", "CNY", 0.2, 0.8, 0.04, "0-32K"),
        ("Qwen3.6 Plus", "Qwen", "CNY", 2.0, 12.0, None, "≤256K"),
        ("Qwen3.5 Plus", "Qwen", "CNY", 0.8, 4.8, None, "0-128K"),
        ("Doubao Seed 2.0 Pro", "Doubao", "CNY", 3.2, 16.0, None, "0-32K"),
        ("Doubao Seed 2.0 Lite", "Doubao", "CNY", 0.6, 3.6, 0.12, "0-32K"),
        ("Doubao Seed 2.0 Mini", "Doubao", "CNY", 0.2, 2.0, 0.04, "0-32K"),
        ("Kimi K3", "Kimi", "CNY", 20.0, 100.0, 2.0, "截图有效价"),
        ("Kimi K2.7 Code", "Kimi", "CNY", 6.5, 27.0, 1.3, "标准档"),
        ("Kimi K2.6", "Kimi", "CNY", 6.5, 27.0, 1.1, "标准档"),
        ("GLM 5.2", "GLM", "CNY", 8.0, 28.0, 2.0, "截图有效价"),
        ("GLM 5.1", "GLM", "CNY", 6.0, 24.0, 1.3, "低输入区间"),
        ("Claude Fable 5", "Claude", "USD", 10.0, 50.0, 1.0, "基础价"),
        ("Claude Opus 4.8", "Claude", "USD", 5.0, 25.0, 0.5, "基础价"),
        ("GPT 5.6 Sol", "GPT", "USD", 5.0, 30.0, 0.5, "≤272K"),
        ("GPT 5.6 Terra", "GPT", "USD", 2.0, 12.0, 0.2, "≤272K"),
        ("GPT 5.6 Luna", "GPT", "USD", 0.2, 1.2, 0.02, "≤272K"),
    ]
    return pd.DataFrame(rows, columns=["model", "family", "currency", "input", "output", "cache_read", "note"])


def configure_style() -> None:
    """Configure a stable, readable style on Windows and CI runners."""
    preferred = ["Microsoft YaHei", "SimHei", "Noto Sans CJK SC", "DejaVu Sans"]
    available = {font.name for font in font_manager.fontManager.ttflist}
    selected = next((font for font in preferred if font in available), "DejaVu Sans")
    sns.set_theme(style="whitegrid", context="notebook", palette="colorblind")
    plt.rcParams.update({"font.sans-serif": [selected], "axes.unicode_minus": False, "figure.dpi": 120})


def save(fig: plt.Figure, output_dir: Path, name: str) -> None:
    """Save a tightly cropped PNG and release its figure resources."""
    output_dir.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_dir / name, dpi=220, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def flow_figure(output_dir: Path) -> None:
    """Draw the end-to-end mathematical routing pipeline."""
    fig, ax = plt.subplots(figsize=(14, 5.4))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 5)
    ax.axis("off")
    boxes = [
        (0.3, "用户任务 x", "文本 / 图片 / 文档", "#e9e6ff"),
        (2.55, "特征提取", "D(x), 类型 t, 关键度 k", "#e8f3ff"),
        (4.8, "工作包 DAG", "I={建模,执行,验证,整合}", "#e7f7ef"),
        (7.05, "模型画像", "Q(i,m), S(i,m), L(m), R(m)", "#fff3dc"),
        (9.3, "价格画像", "C(m), Cost(i,m)", "#ffe9ec"),
        (11.55, "质量约束优化", "x_im, y_m, F_i, b", "#e6efff"),
    ]
    for x, title, detail, color in boxes:
        ax.add_patch(patches.FancyBboxPatch((x, 2.0), 1.75, 1.25, boxstyle="round,pad=0.04,rounding_size=0.08", linewidth=1.4, edgecolor="#384d6b", facecolor=color))
        ax.text(x + 0.875, 2.78, title, ha="center", va="center", fontsize=11, weight="bold")
        ax.text(x + 0.875, 2.34, detail, ha="center", va="center", fontsize=8.5, wrap=True)
    for left in [2.05, 4.3, 6.55, 8.8, 11.05]:
        ax.annotate("", xy=(left + 0.42, 2.62), xytext=(left, 2.62), arrowprops={"arrowstyle": "-|>", "lw": 1.6, "color": "#53657d"})
    ax.add_patch(patches.FancyBboxPatch((4.55, 0.35), 4.9, 0.85, boxstyle="round,pad=0.04,rounding_size=0.08", linewidth=1.2, edgecolor="#72518b", facecolor="#f5edff"))
    ax.text(7.0, 0.78, "U_im = w_q Q + w_c C + w_l(1-L) + w_s S - w_r R\n             - λ d_m - κ [q_i - Q(i,m)]_+", ha="center", va="center", fontsize=9.2, weight="bold")
    ax.annotate("", xy=(7.0, 2.0), xytext=(7.0, 1.2), arrowprops={"arrowstyle": "-|>", "lw": 1.4, "color": "#72518b"})
    ax.add_patch(patches.FancyBboxPatch((10.5, 0.35), 3.1, 0.85, boxstyle="round,pad=0.04,rounding_size=0.08", linewidth=1.2, edgecolor="#2d6d62", facecolor="#e8f7f0"))
    ax.text(12.05, 0.78, "模型分配 -> 执行 -> DeepSeek V4 Pro 整合", ha="center", va="center", fontsize=9.5, weight="bold")
    ax.annotate("", xy=(12.05, 2.0), xytext=(12.05, 1.2), arrowprops={"arrowstyle": "-|>", "lw": 1.4, "color": "#2d6d62"})
    ax.text(7.0, 4.35, "质量约束成本感知路由的数学模型结构", ha="center", va="center", fontsize=16, weight="bold", color="#24344d")
    ax.text(7.0, 3.82, "先构造可审计的工作包和模型画像，再在质量下限与预算约束下求解 x_im", ha="center", va="center", fontsize=10, color="#52647d")
    save(fig, output_dir, "model-router-math-model.png")


def objective_figure(output_dir: Path) -> None:
    """Draw the complexity-dependent objective weights."""
    weights = pd.DataFrame({
        "质量 Q": [0.30, 0.45, 0.55],
        "成本 C": [0.50, 0.30, 0.16],
        "延迟 1-L": [0.14, 0.10, 0.06],
        "专长 S": [0.04, 0.10, 0.16],
        "风险惩罚 R": [0.02, 0.05, 0.07],
    }, index=["simple", "balanced", "complex"])
    fig, ax = plt.subplots(figsize=(10, 5.5))
    colors = sns.color_palette("Set2", n_colors=len(weights.columns))
    bottom = pd.Series(0.0, index=weights.index)
    for color, column in zip(colors, weights.columns):
        values = weights[column]
        ax.bar(weights.index, values, bottom=bottom, label=column, color=color)
        bottom += values
    for index, row in weights.iterrows():
        ax.text(index, 1.03, f"Σw={row.sum():.2f}", ha="center", fontsize=9)
    ax.set_ylim(0, 1.12)
    ax.set_ylabel("权重")
    ax.set_title("复杂度自适应的多目标效用函数权重", weight="bold", pad=14)
    ax.legend(ncol=3, loc="upper center", bbox_to_anchor=(0.5, -0.13), frameon=False)
    ax.text(0.01, -0.23, "U_im 同时考虑质量、成本、延迟、专长和风险；复杂任务提高质量与专长权重。", transform=ax.transAxes, fontsize=9, color="#52647d")
    save(fig, output_dir, "model-router-objective-components.png")


def price_scatter_figure(output_dir: Path, prices: pd.DataFrame) -> None:
    """Compare input and output prices without mixing currencies."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.8), constrained_layout=True)
    for ax, currency in zip(axes, ["CNY", "USD"]):
        subset = prices[prices.currency == currency].copy()
        sns.scatterplot(data=subset, x="input", y="output", hue="family", style="family", s=95, ax=ax, legend=currency == "CNY")
        for _, row in subset.iterrows():
            ax.annotate(row.model.replace(" ", "\n", 1), (row.input, row.output), xytext=(5, 4), textcoords="offset points", fontsize=7)
        ax.set_xscale("log")
        ax.set_yscale("log")
        ax.set_xlabel(f"输入价格（{currency}/百万 token，对数）")
        ax.set_ylabel(f"输出价格（{currency}/百万 token，对数）")
        ax.set_title(f"{currency} 参考价格快照", weight="bold")
        ax.grid(True, which="both", alpha=0.25)
    axes[0].legend(title="模型族", frameon=True, fontsize=8)
    fig.suptitle("用户提供价格数据的输入—输出价格分布", fontsize=15, weight="bold")
    save(fig, output_dir, "model-router-price-input-output.png")


def cache_discount_figure(output_dir: Path, prices: pd.DataFrame) -> None:
    """Show the cache-read discount as a multiple of ordinary input price."""
    subset = prices.dropna(subset=["cache_read"]).copy()
    subset["discount"] = subset.input / subset.cache_read
    subset = subset.sort_values(["currency", "discount"], ascending=[True, False])
    fig, axes = plt.subplots(1, 2, figsize=(14, 6.2), constrained_layout=True)
    for ax, currency in zip(axes, ["CNY", "USD"]):
        values = subset[subset.currency == currency].sort_values("discount")
        ax.barh(values.model, values.discount, color=sns.color_palette("crest", n_colors=max(len(values), 2))[:len(values)])
        ax.axvline(1, color="#8c8c8c", lw=1)
        ax.set_xlabel("普通输入价 / 缓存命中输入价（倍）")
        ax.set_title(f"{currency} 缓存命中折扣", weight="bold")
        ax.tick_params(axis="y", labelsize=8)
        for y, value in enumerate(values.discount):
            ax.text(value + max(value * 0.02, 0.03), y, f"{value:.1f}×", va="center", fontsize=8)
    fig.suptitle("缓存读取价格对有效成本的影响", fontsize=15, weight="bold")
    save(fig, output_dir, "model-router-cache-discount.png")


def scenario_cost_figure(output_dir: Path, prices: pd.DataFrame) -> None:
    """Estimate one common workload cost in each currency separately."""
    input_tokens, output_tokens, cache_ratio = 100_000, 10_000, 0.40
    rows = []
    for _, row in prices.iterrows():
        if pd.isna(row.cache_read):
            input_cost = input_tokens * row.input
            cache_note = "无缓存价，按普通输入"
        else:
            input_cost = input_tokens * ((1 - cache_ratio) * row.input + cache_ratio * row.cache_read)
            cache_note = "40%缓存命中"
        total = (input_cost + output_tokens * row.output) / 1_000_000
        rows.append({"model": row.model, "family": row.family, "currency": row.currency, "cost": total, "note": cache_note})
    scenario = pd.DataFrame(rows)
    fig, axes = plt.subplots(1, 2, figsize=(14, 7), constrained_layout=True)
    for ax, currency in zip(axes, ["CNY", "USD"]):
        values = scenario[scenario.currency == currency].sort_values("cost", ascending=True)
        sns.barplot(data=values, x="cost", y="model", hue="family", dodge=False, ax=ax, legend=False, palette="colorblind")
        ax.set_xlabel(f"估计费用（{currency}）")
        ax.set_ylabel("")
        ax.set_title(f"{currency}：100K 输入 + 10K 输出", weight="bold")
        ax.tick_params(axis="y", labelsize=8)
        for y, value in enumerate(values.cost):
            ax.text(value + max(values.cost.max() * 0.012, 0.001), y, f"{value:.3f}", va="center", fontsize=8)
    fig.suptitle("统一 token 场景下的费用估计（40% 输入缓存命中）", fontsize=15, weight="bold")
    save(fig, output_dir, "model-router-scenario-cost.png")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "docs" / "images" / "model-router")
    args = parser.parse_args()
    configure_style()
    prices = price_rows()
    flow_figure(args.output_dir)
    objective_figure(args.output_dir)
    price_scatter_figure(args.output_dir, prices)
    cache_discount_figure(args.output_dir, prices)
    scenario_cost_figure(args.output_dir, prices)
    print(f"Generated 5 figures in {args.output_dir} from {len(prices)} reference rows ({REFERENCE_DATE}).")


if __name__ == "__main__":
    main()
