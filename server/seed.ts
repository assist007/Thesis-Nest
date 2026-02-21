import { db } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "thesisnest_salt").digest("hex");
}

export async function seedDatabase() {
  try {
    // Check if already seeded
    const existing = await db.select().from(schema.users).limit(1);
    if (existing.length > 0) return;

    console.log("Seeding database...");

    // Departments
    const [cse, eee, bba, mba] = await db.insert(schema.departments).values([
      { name: "Computer Science & Engineering", code: "CSE", description: "Department of Computer Science and Engineering" },
      { name: "Electrical & Electronic Engineering", code: "EEE", description: "Department of Electrical and Electronic Engineering" },
      { name: "Business Administration", code: "BBA", description: "Department of Business Administration" },
      { name: "Master of Business Administration", code: "MBA", description: "Graduate Business Program" },
    ]).returning();

    // Admin
    const [admin] = await db.insert(schema.users).values([{
      name: "System Admin",
      email: "admin@thesisnest.edu",
      username: "admin",
      password: hashPassword("admin123"),
      role: "admin",
      isApproved: true,
      contact: "+880 1700-000001",
      departmentId: null,
      batchYear: null,
    }]).returning();

    // Supervisors
    const [sup1, sup2] = await db.insert(schema.users).values([
      {
        name: "Dr. Rahman Chowdhury",
        email: "supervisor@thesisnest.edu",
        username: "dr_rahman",
        password: hashPassword("super123"),
        role: "supervisor",
        isApproved: true,
        departmentId: cse.id,
        contact: "+880 1711-222333",
        batchYear: null,
      },
      {
        name: "Prof. Fatema Begum",
        email: "fatema@thesisnest.edu",
        username: "prof_fatema",
        password: hashPassword("fatema123"),
        role: "supervisor",
        isApproved: true,
        departmentId: eee.id,
        contact: "+880 1711-444555",
        batchYear: null,
      },
      {
        name: "Dr. Karim Uddin",
        email: "karim@thesisnest.edu",
        username: "dr_karim",
        password: hashPassword("karim123"),
        role: "supervisor",
        isApproved: false, // Pending approval
        departmentId: bba.id,
        contact: "+880 1722-111222",
        batchYear: null,
      },
    ]).returning();

    // Students
    const [stu1, stu2, stu3] = await db.insert(schema.users).values([
      {
        name: "Md. Rifat Hossain",
        email: "student@thesisnest.edu",
        username: "rifat_h",
        password: hashPassword("student123"),
        role: "student",
        isApproved: true,
        departmentId: cse.id,
        batchYear: 2021,
        contact: "+880 1834-567890",
      },
      {
        name: "Tasnim Jahan",
        email: "tasnim@thesisnest.edu",
        username: "tasnim_j",
        password: hashPassword("tasnim123"),
        role: "student",
        isApproved: true,
        departmentId: cse.id,
        batchYear: 2022,
        contact: "+880 1845-678901",
      },
      {
        name: "Abdullah Al Mamun",
        email: "mamun@thesisnest.edu",
        username: "al_mamun",
        password: hashPassword("mamun123"),
        role: "student",
        isApproved: true,
        departmentId: eee.id,
        batchYear: 2021,
        contact: "+880 1856-789012",
      },
    ]).returning();

    // Theses
    const [thesis1] = await db.insert(schema.theses).values({
      studentId: stu1.id,
      supervisorId: sup1.id,
      title: "Deep Learning-Based Traffic Sign Recognition System for Autonomous Vehicles",
      abstract: "This research proposes a novel convolutional neural network architecture for real-time traffic sign recognition in autonomous driving scenarios. The system achieves 98.7% accuracy on the GTSRB dataset with inference time under 15ms using optimized TensorRT deployment.",
      status: "approved",
      currentVersion: 2,
    }).returning();

    const [thesis2] = await db.insert(schema.theses).values({
      studentId: stu2.id,
      supervisorId: sup1.id,
      title: "Blockchain-Based Academic Credential Verification Platform",
      abstract: "A decentralized application using Ethereum blockchain for tamper-proof academic credential storage and verification. The system enables instant verification by employers and reduces credential fraud by 100% through cryptographic attestation.",
      status: "need_changes",
      currentVersion: 1,
    }).returning();

    const [thesis3] = await db.insert(schema.theses).values({
      studentId: stu3.id,
      supervisorId: null,
      title: "Energy-Efficient Smart Grid Management Using IoT Sensors",
      abstract: "This study investigates the deployment of IoT sensors and edge computing for real-time energy consumption monitoring and optimization in smart grids. A fuzzy logic controller reduces peak demand by 23% compared to conventional approaches.",
      status: "submitted",
      currentVersion: 1,
    }).returning();

    // Thesis Versions
    await db.insert(schema.thesisVersions).values([
      { thesisId: thesis1.id, version: 1, fileName: "traffic_sign_recognition_v1.pdf", fileSize: "2.4 MB" },
      { thesisId: thesis1.id, version: 2, fileName: "traffic_sign_recognition_v2_revised.pdf", fileSize: "2.8 MB" },
      { thesisId: thesis2.id, version: 1, fileName: "blockchain_credentials_v1.pdf", fileSize: "1.9 MB" },
      { thesisId: thesis3.id, version: 1, fileName: "smart_grid_iot_v1.pdf", fileSize: "3.1 MB" },
    ]);

    // Feedback
    await db.insert(schema.feedbacks).values([
      {
        thesisId: thesis1.id,
        supervisorId: sup1.id,
        comment: "Excellent work on the neural network architecture! The accuracy results are impressive. Please expand the literature review section to include more recent papers from 2023-2024.",
      },
      {
        thesisId: thesis1.id,
        supervisorId: sup1.id,
        comment: "The revised version looks great. Well done on addressing all the previous comments. Approving this thesis.",
      },
      {
        thesisId: thesis2.id,
        supervisorId: sup1.id,
        comment: "Good foundational work, but the smart contract security analysis needs to be more thorough. Please address potential reentrancy vulnerabilities and add formal verification. Also, please include gas cost analysis for the proposed solution.",
      },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}
