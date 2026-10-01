# Question Generation State

**Last Updated:** 2026-10-01 (Session 3 — import complete)
**Status:** ALL GENERATION AND IMPORT COMPLETE

## Database Summary
| Source | Questions |
|--------|-----------|
| Original (research files, topics 1-2,11-16,19-20) | 530 |
| Generated + imported (topics 3-10,17-18,21-50) | 1,125 |
| Skipped as cross-topic duplicates | 20 |
| **Total in database** | **1,655** |

## Per-Topic Verified Counts (from database)
| Topic | Name | Qs | Source |
|-------|------|----|--------|
| 1 | The Universe and Cosmology Basics | 50 | original |
| 2 | The Solar System – Overview | 50 | original |
| 3 | The Sun — Our Star | 45 | generated |
| 4 | Mercury and Venus — The Inner Planets | 30 | generated |
| 5 | Earth — Our Home Planet | 31 | generated |
| 6 | The Moon | 38 | generated |
| 7 | Mars — The Red Planet | 39 | generated |
| 8 | Jupiter and Saturn — The Gas Giants | 42 | generated |
| 9 | Uranus and Neptune — The Ice Giants | 25 | generated |
| 10 | Dwarf Planets, Asteroids, Comets and Meteors | 34 | generated |
| 11 | Stars and Stellar Evolution | 50 | original |
| 12 | Galaxies and the Milky Way | 50 | original |
| 13 | Black Holes | 50 | original |
| 14 | Exoplanets and the Search for Life | 60 | original |
| 15 | The Electromagnetic Spectrum in Astronomy | 50 | original |
| 16 | Telescopes and Space Observatories | 60 | original |
| 17 | Rocket Science Fundamentals | 42 | generated |
| 18 | Orbits and Orbital Mechanics | 38 | generated |
| 19 | Gravity, Escape Velocity and Microgravity | 50 | original |
| 20 | History of Space Exploration – Key Milestones | 60 | original |
| 21 | The Indian Space Programme — History and Vision | 38 | generated |
| 22 | ISRO — Organisation, Centres and Infrastructure | 27 | generated |
| 23 | Vikram Sarabhai — Father of the Indian Space Programme | 30 | generated |
| 24 | Key Indian Space Scientists and Leaders | 38 | generated |
| 25 | Indian Launch Vehicles — PSLV | 34 | generated |
| 26 | Indian Launch Vehicles — GSLV and LVM3 | 33 | generated |
| 27 | Indian Launch Vehicles — SLV, ASLV, SSLV and Sounding Rockets | 34 | generated |
| 28 | Satish Dhawan Space Centre, Sriharikota (SDSC SHAR) | 33 | generated |
| 29 | Indian Communication Satellites (INSAT/GSAT/CMS) | 35 | generated |
| 30 | Indian Earth Observation Satellites (IRS/EOS) | 34 | generated |
| 31 | NavIC — Indian Regional Navigation Satellite System | 31 | generated |
| 32 | Indian Meteorological and Scientific Satellites | 27 | generated |
| 33 | Chandrayaan-1 — India's First Lunar Mission | 26 | generated |
| 34 | Chandrayaan-2 — Orbiter, Lander, and Rover | 25 | generated |
| 35 | Chandrayaan-3 — India Lands on the Moon | 26 | generated |
| 36 | Mars Orbiter Mission (Mangalyaan) | 25 | generated |
| 37 | Aditya-L1 — India's First Solar Observatory | 18 | generated |
| 38 | AstroSat — India's First Multi-Wavelength Space Observatory | 17 | generated |
| 39 | Gaganyaan — India's Human Spaceflight Programme | 22 | generated |
| 40 | SpaDeX — Space Docking Experiment | 17 | generated |
| 41 | XPoSat, NISAR, and Other Recent/Upcoming ISRO Missions | 19 | generated |
| 42 | Space Stations and Life in Space | 21 | generated |
| 43 | Human Spaceflight — History and Key Missions | 14 | generated |
| 44 | NASA and the US Space Programme | 18 | generated |
| 45 | International Space Agencies (ESA, Roscosmos, CNSA, JAXA) | 18 | generated |
| 46 | Moon Exploration — International Missions | 19 | generated |
| 47 | Mars Exploration — International Missions | 20 | generated |
| 48 | Space Debris and Space Sustainability | 20 | generated |
| 49 | Satellite Applications and Space Technology | 20 | generated |
| 50 | World Space Week and the "Rocket Revolution" Theme | 22 | generated |

## Import Details
- **Importer script:** `server/src/import_generated_questions.js`
- **Database backup:** `data/quiz.db.backup_before_import`
- **Answer option randomisation:** Applied to all 1,125 imported questions (Fisher-Yates shuffle)
- **Duplicate detection:** Normalised text matching; 20 cross-topic duplicates skipped
- **Original 530 questions:** Verified intact and unmodified

## Validation Results
- All 50 topics have questions: YES
- Missing explanations: 0
- Missing sources: 0
- Missing difficulty: 0
- Missing option_d: 0
- Invalid answers: 0
- Parse errors: 0
- Answer distribution (new imports): A 22.7%, B 24.6%, C 26.4%, D 26.3%
- Difficulty distribution: Easy 609, Medium 794, Hard 252
