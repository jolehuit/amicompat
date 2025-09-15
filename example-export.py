#!/usr/bin/env python3
"""
Exemple d'utilisation de la fonctionnalité d'export des rapports d'audit
"""
import json
import os
from pathlib import Path

def create_sample_audit_report():
    """Crée un exemple de rapport d'audit pour démonstration"""
    return {
        "summary": {
            "files_scanned": 25,
            "features_total": 8,
            "score_global": 75.5,
            "coverage_by_browser": {
                "chrome": 90.0,
                "firefox": 85.0,
                "safari": 70.0,
                "edge": 88.0
            },
            "target": "baseline-2024"
        },
        "features": [
            {
                "id": "css-container-queries",
                "name": "CSS Container Queries",
                "status": "newly",
                "browsers": {
                    "chrome": "105",
                    "firefox": "110",
                    "safari": "16",
                    "edge": "105"
                },
                "files": [
                    {"path": "src/components/Card.css", "hits": 3},
                    {"path": "src/styles/layout.css", "hits": 5}
                ],
                "total_hits": 8,
                "file_count": 2
            },
            {
                "id": "css-has-selector",
                "name": "CSS :has() Selector",
                "status": "limited",
                "browsers": {
                    "chrome": "105",
                    "firefox": "121",
                    "safari": "15.4",
                    "edge": "105"
                },
                "files": [
                    {"path": "src/components/Button.css", "hits": 2}
                ],
                "total_hits": 2,
                "file_count": 1
            }
        ],
        "next_actions": [
            "Add CSS Container Query polyfill for Safari < 16",
            "Test :has() selector fallback for older browsers"
        ],
        "generated_at": "2024-01-15T10:30:00"
    }

def demonstrate_export():
    """Démontre l'utilisation de la fonctionnalité d'export"""
    print("🔍 Démonstration de l'export de rapport d'audit\n")

    # Créer un rapport d'exemple
    report = create_sample_audit_report()

    # Exporter dans différents formats
    exports = [
        ("audit-report.json", "Rapport JSON complet"),
        ("reports/audit-summary.json", "Rapport dans un sous-dossier"),
        ("audit-backup.json", "Sauvegarde du rapport")
    ]

    for export_path, description in exports:
        try:
            # Créer le répertoire si nécessaire
            dir_path = os.path.dirname(export_path)
            if dir_path:
                os.makedirs(dir_path, exist_ok=True)

            # Exporter le rapport
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

            print(f"✅ {description}")
            print(f"   📁 Sauvegardé dans: {export_path}")
            print(f"   📊 Taille: {os.path.getsize(export_path)} octets\n")

        except Exception as e:
            print(f"❌ Erreur lors de l'export vers {export_path}: {e}\n")

    print("💡 Utilisation dans Cursor:")
    print('   "Audit my project at /path/to/project with export to audit-report.json"')
    print('   "Export the last audit report to reports/my-audit.json"')

if __name__ == "__main__":
    demonstrate_export()






