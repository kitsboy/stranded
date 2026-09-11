# Contributing to [Project Name]

## Welcome

Thank you for considering contributing to this Give A Bit project!

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Generated outputs — regenerate them with your version bump (CI will go red otherwise)

The `Docs in sync (read-only check)` step in `.github/workflows/ci.yml` owns these
seven generated artefacts:

```
public/data/live-stats.json public/status.json docs/LIVE-STATS.md
docs/SOURCE-OF-TRUTH.md docs/DOCUMENTATION.md STATUS.md README.md
```

They embed the project `version` (read from `package.json`) plus a build clock
(`generatedAt` / `buildId`). The check snapshots them, re-runs the generators, and
fails if anything other than the build clock changed. Because `version` is **not**
normalised away — the site serves these files, so a stale version is real drift —
**any commit that changes `package.json`'s version must regenerate these outputs in
the same commit**, or CI goes red (correctly).

Use the built-in hook:

```bash
npm version 2.11.1        # bumps package.json + package-lock.json, runs the
                          # `version` lifecycle hook, which regenerates all seven
                          # outputs and stages them — then commits and tags
```

If you bump the version by hand instead, run the sync and stage all seven files
before committing:

```bash
npm run docs:sync
git add public/data/live-stats.json public/status.json docs/LIVE-STATS.md \
        docs/SOURCE-OF-TRUTH.md docs/DOCUMENTATION.md STATUS.md README.md
```

Never "fix" a red `Docs in sync` run by loosening the check.

## Code of Conduct

- Be respectful and constructive
- Focus on Bitcoin sovereignty and education
- Keep Safe Harbour principles in mind

## Development Setup

```bash
git clone https://github.com/kitsboy/[project-name].git
cd [project-name]
npm install
npm run dev
```

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation (README, CHANGELOG) alongside code
- Ensure Safe Harbour + giveabit.io linkage in public docs
- Follow existing code style

## Questions?

Open an issue or reach out via the Give A Bit community.

---

*Part of the [Give A Bit](https://giveabit.io) family.*
