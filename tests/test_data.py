"""Garantías de la base de datos: se ejecutan en cada push antes de publicar."""
import json, sqlite3, subprocess, sys, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class DataTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        result = subprocess.run([sys.executable, str(ROOT / 'tools' / 'build_data.py')], capture_output=True, text=True)
        assert result.returncode == 0, result.stdout + result.stderr
        cls.data = json.loads((ROOT / 'public' / 'data' / 'techtree.json').read_text(encoding='utf-8'))
        cls.by = {n['id']: n for n in cls.data['nodes']}

    def test_requirements_exist_and_precede(self):
        for n in self.data['nodes']:
            for r in n['requires']:
                self.assertIn(r, self.by, f"{n['id']} requiere {r}")
                self.assertLessEqual(self.by[r]['year'], n['year'], f"{n['id']} es anterior a su requisito {r}")

    def test_only_documented_roots(self):
        """Solo los primeros gestos técnicos pueden carecer de requisitos; todo lo demás viene de algo."""
        roots = {n['id'] for n in self.data['nodes'] if not n['requires']}
        self.assertEqual(roots, {'percusion-dura', 'uso-fuego', 'cuerda', 'cuerda-primitiva', 'ambar'})

    def test_every_node_is_complete(self):
        for n in self.data['nodes']:
            self.assertRegex(n['id'], r'^[a-z0-9]+(-[a-z0-9]+)*$')
            self.assertTrue(n['name'] and len(n["summary"]) >= 24, n['id'])
            self.assertGreaterEqual(n['year'], -3400000); self.assertLessEqual(n['year'], 2026)
            self.assertLessEqual(len(n['requires']), 8, f"{n['id']}: los requisitos deben ser inmediatos, no toda la cadena")

    def test_no_redundant_self_or_duplicate_requirements(self):
        for n in self.data['nodes']:
            self.assertEqual(len(n['requires']), len(set(n['requires'])), n['id'])
            self.assertNotIn(n['id'], n['requires'])

    def test_sqlite_matches_json(self):
        db = sqlite3.connect(ROOT / 'public' / 'data' / 'techtree.db')
        self.assertEqual(db.execute('SELECT count(*) FROM technology').fetchone()[0], len(self.data['nodes']))
        self.assertEqual(db.execute('SELECT count(*) FROM requirement').fetchone()[0], sum(len(n['requires']) for n in self.data['nodes']))
        self.assertEqual(db.execute("SELECT name FROM technology WHERE id='bombilla'").fetchone()[0], self.by['bombilla']['name'])


if __name__ == '__main__':
    unittest.main()
