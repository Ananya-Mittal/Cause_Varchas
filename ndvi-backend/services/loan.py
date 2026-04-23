"""
services/loan.py — Loan limit calculation + underwriting decision.
"""

from typing import Tuple


def loan_decision(
    revenue: float,
    score: float,
    area_ha: float = 1.0,
) -> Tuple[float, str, str]:
    """
    Returns (loan_limit_inr, decision_label, risk_tier).

    Scoring tiers
    -------------
    ≥ 75 → Approve     (up to 80 % of revenue, min ₹50 000)
    55–74 → Conditional (up to 60 % of revenue, capped)
    40–54 → Manual Review
    < 40  → Reject
    """
    if score >= 75:
        multiplier = 0.80
        decision   = "Approve"
        risk_tier  = "Low Risk"
    elif score >= 55:
        multiplier = 0.60
        decision   = "Conditional"
        risk_tier  = "Moderate Risk"
    elif score >= 40:
        multiplier = 0.30
        decision   = "Manual Review"
        risk_tier  = "High Risk"
    else:
        multiplier = 0.0
        decision   = "Reject"
        risk_tier  = "Very High Risk"

    # Scale by area; ensure minimum meaningful limit when approved
    raw_limit = revenue * (score / 100) * multiplier * area_ha

    if decision == "Approve":
        loan_limit = max(raw_limit, 50_000)
    elif decision == "Conditional":
        loan_limit = max(raw_limit, 20_000)
    else:
        loan_limit = 0.0

    return round(loan_limit, 2), decision, risk_tier
