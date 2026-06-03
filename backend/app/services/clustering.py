"""
Clustering — groups stocks by behavioural similarity using PCA.
Same approach as PitWall DNA but for stocks instead of drivers.
"""
import numpy as np
from sklearn.preprocessing import StandardScaler


def compute_pca_embedding(profiles: list[dict]) -> list[dict]:
    """
    Takes a list of stock DNA profiles and returns 2D PCA coordinates
    for the style scatter plot.
    """
    if len(profiles) < 2:
        return [
            {
                "symbol":      p["symbol"],
                "name":        p["name"],
                "sector":      p["sector"],
                "sector_color": p["sector_color"],
                "x":           float(i),
                "y":           0.0,
                "style_dimensions": p["style_dimensions"],
            }
            for i, p in enumerate(profiles)
        ]

    # Build feature matrix
    X = np.array([
        [dim["value"] for dim in p["style_dimensions"]]
        for p in profiles
    ])

    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    # PCA to 2D
    X_centered = Xs - Xs.mean(axis=0)
    cov = np.cov(X_centered.T)
    eigenvalues, eigenvectors = np.linalg.eigh(cov)
    idx = np.argsort(eigenvalues)[::-1]
    components = eigenvectors[:, idx[:2]]
    coords = X_centered @ components

    return [
        {
            "symbol":           p["symbol"],
            "name":             p["name"],
            "sector":           p["sector"],
            "sector_color":     p["sector_color"],
            "x":                float(coords[i, 0]),
            "y":                float(coords[i, 1]),
            "latest_price":     p.get("latest_price", 0),
            "price_change_1y":  p.get("price_change_1y", 0),
            "style_dimensions": p["style_dimensions"],
        }
        for i, p in enumerate(profiles)
    ]