const fs = require("fs");
const { Client } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function importData() {
  try {
    await client.connect();
    console.log("Connected to database. Starting import...");

    // 1. IMPORT COURSES
    const courses = JSON.parse(fs.readFileSync("./courses.json", "utf8"));
    for (const c of courses) {
      await client.query(
        `INSERT INTO courses (id, language_code, language_name, flag_emoji, accent_color, learner_count, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.language_code,
          c.language_name,
          c.flag_emoji,
          c.accent_color,
          c.learner_count,
          c.sort_order,
        ],
      );
    }
    console.log("✅ Courses imported.");

    // 2. IMPORT UNITS
    const units = JSON.parse(fs.readFileSync("./units.json", "utf8"));
    for (const u of units) {
      await client.query(
        `INSERT INTO units (id, course_id, "order", title, description, color) 
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.course_id, u.order, u.title, u.description, u.color],
      );
    }
    console.log("✅ Units imported.");

    // 3. IMPORT LESSONS
    const lessons = JSON.parse(fs.readFileSync("./lessons.json", "utf8"));
    for (const l of lessons) {
      await client.query(
        `INSERT INTO lessons (id, unit_id, course_id, "order", title) 
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [l.id, l.unit_id, l.course_id, l.order, l.title],
      );
    }
    console.log("✅ Lessons imported.");

    // 4. IMPORT SHOP ITEMS
    const shopItems = JSON.parse(fs.readFileSync("./shop_items.json", "utf8"));
    for (const item of shopItems) {
      await client.query(
        `INSERT INTO shop_items (id, name, description, price_gems, category, effect, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.name,
          item.description,
          item.price_gems,
          item.category,
          item.effect,
          item.sort_order,
        ],
      );
    }
    console.log("✅ Shop items imported.");

    // 5. IMPORT EXERCISES
    const exercises = JSON.parse(fs.readFileSync("./exercises.json", "utf8"));
    for (const ex of exercises) {
      await client.query(
        `INSERT INTO exercises (id, lesson_id, "order", kind, prompt, prompt_translation, audio_url, correct_answer, accepted_answers, choices, word_bank, pairs, hint, explanation) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
        [
          ex.id,
          ex.lesson_id,
          ex.order,
          ex.kind,
          ex.prompt,
          ex.prompt_translation,
          ex.audio_url,
          ex.correct_answer,
          ex.accepted_answers ? JSON.stringify(ex.accepted_answers) : null,
          ex.choices ? JSON.stringify(ex.choices) : null,
          ex.word_bank ? JSON.stringify(ex.word_bank) : null,
          ex.pairs ? JSON.stringify(ex.pairs) : null,
          ex.hint,
          ex.explanation,
        ],
      );
    }
    console.log("✅ Exercises imported.");

    // 6. IMPORT ACHIEVEMENTS
    const achievements = JSON.parse(
      fs.readFileSync("./achievements.json", "utf8"),
    );
    for (const ach of achievements) {
      await client.query(
        `INSERT INTO achievements (id, title, description, icon, tier, target, metric, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
        [
          ach.id,
          ach.title,
          ach.description,
          ach.icon,
          ach.tier,
          ach.target,
          ach.metric,
          ach.sort_order,
        ],
      );
    }
    console.log("✅ Achievements imported.");
  } catch (err) {
    console.error("❌ Error during import:", err);
  } finally {
    await client.end();
    console.log("Done!");
  }
}

importData();
