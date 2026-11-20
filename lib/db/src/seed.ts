import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { db, serviceCategories, users } from "./index";

const scrypt = promisify(scryptCallback);
const categories = [
  ["electrical", "الكهرباء", "Electrical services", "تمديدات الكهرباء وإصلاح الأعطال", "Wiring and electrical repairs", "zap"],
  ["air-conditioning", "المكيفات", "Air conditioning", "فحص وصيانة أجهزة التكييف", "Air-conditioning inspection and repair", "fan"],
  ["refrigerators", "الثلاجات والمجمدات", "Refrigerators and freezers", "تشخيص وصيانة الثلاجات والمجمدات", "Refrigerator and freezer repair", "refrigerator"],
  ["washing-machines", "الغسالات", "Washing machines", "إصلاح الغسالات وتشخيص أعطالها", "Washing-machine repair", "washer"],
  ["appliances", "الأجهزة الكهربائية المنزلية", "Home electrical appliances", "صيانة الأجهزة المنزلية الكهربائية", "Home appliance repair", "plug"],
  ["electronics", "الإلكترونيات والخدمات التقنية", "Electronics and technical services", "صيانة الأجهزة الإلكترونية والتقنية", "Electronics and technical services", "tv"],
  ["metal-fabrication", "الحدادة والتصنيع المعدني", "Metalworking and fabrication", "أعمال اللحام والتصنيع المعدني", "Welding and metal fabrication", "hammer"],
  ["industrial-equipment", "المعدات الصناعية", "Industrial equipment and machinery", "فحص وصيانة المعدات الصناعية", "Industrial equipment maintenance", "factory"],
] as const;

async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${digest.toString("hex")}`;
}

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for seed");

await db.insert(serviceCategories).values(categories.map(([slug, nameAr, nameEn, descriptionAr, descriptionEn, icon], sortOrder) => ({ slug, nameAr, nameEn, descriptionAr, descriptionEn, icon, sortOrder }))).onConflictDoNothing({ target: serviceCategories.slug });
await db.insert(users).values({ email: adminEmail, displayName: "FixMate Administrator", passwordHash: await passwordHash(adminPassword), role: "admin", status: "active" }).onConflictDoNothing({ target: users.email });
console.log("FixMate seed completed");
process.exit(0);
