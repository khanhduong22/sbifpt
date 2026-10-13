import { computeAuditHash, GENESIS_HASH, canonicalJsonStringify } from '@sbifpt/audit-trail';
import prisma from './index';

// Date utility to format YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Add days to date
function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export async function seedDatabase() {
  console.log('🌱 Starting SBI FPT Enterprise Database Seeding...');

  // 1. Clean existing records in correct relation order
  console.log('🧹 Cleaning previous records...');
  await prisma.auditLog.deleteMany();
  await prisma.oDCSwipe.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed 10 Realistic Employees
  console.log('👥 Seeding 10 enterprise employees...');
  const usersData = [
    {
      name: 'Kenjiro Tanaka',
      email: 'tanaka.kenjiro@sbi-fpt.com',
      role: 'EXECUTIVE',
      billingRatePerHour: 85.0,
      costRatePerHour: 38.0,
      odcCardId: 'ODC-001',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      department: 'Executive Board',
    },
    {
      name: 'Nguyen Van Thang',
      email: 'thang.nv@sbi-fpt.com',
      role: 'PM',
      billingRatePerHour: 55.0,
      costRatePerHour: 24.0,
      odcCardId: 'ODC-002',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Yuki Takahashi',
      email: 'takahashi.yuki@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 50.0,
      costRatePerHour: 23.0,
      odcCardId: 'ODC-003',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Tran Duc Minh',
      email: 'minh.td@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 48.0,
      costRatePerHour: 21.0,
      odcCardId: 'ODC-004',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Pham Hoang Nam',
      email: 'nam.ph@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 42.0,
      costRatePerHour: 18.0,
      odcCardId: 'ODC-005',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Le Thi Mai',
      email: 'mai.lt@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 42.0,
      costRatePerHour: 18.0,
      odcCardId: 'ODC-006',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Doan Quoc Bao',
      email: 'bao.dq@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 40.0,
      costRatePerHour: 17.0,
      odcCardId: 'ODC-007',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Vu Tuan Anh',
      email: 'anh.vt@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 30.0,
      costRatePerHour: 12.0,
      odcCardId: 'ODC-008',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Hoang Kim Ngan',
      email: 'ngan.hk@sbi-fpt.com',
      role: 'DEV',
      billingRatePerHour: 30.0,
      costRatePerHour: 12.0,
      odcCardId: 'ODC-009',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      department: 'Delivery Unit 1',
    },
    {
      name: 'Sato Haruto',
      email: 'sato.haruto@sbi-fpt.com',
      role: 'AUDITOR',
      billingRatePerHour: 0.0,
      costRatePerHour: 28.0,
      odcCardId: 'ODC-010',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      department: 'Risk & Compliance',
    },
  ];

  const userMap = new Map<string, string>();
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u });
    userMap.set(u.email, created.id);
  }

  // 3. Seed Projects
  console.log('📁 Seeding enterprise projects...');
  const prjCore = await prisma.project.create({
    data: {
      code: 'PRJ-SBI-CORE',
      name: 'SBI Shinsei Core Banking Modernization',
      clientName: 'SBI Shinsei Bank Tokyo',
      status: 'ACTIVE',
      budgetHours: 2500,
      billingType: 'TIME_AND_MATERIALS',
    },
  });

  const prjNeo = await prisma.project.create({
    data: {
      code: 'PRJ-SBI-NEO',
      name: 'SBI NeoMobile Securities Microservices',
      clientName: 'SBI Securities',
      status: 'ACTIVE',
      budgetHours: 1800,
      billingType: 'TIME_AND_MATERIALS',
    },
  });

  const prjBench = await prisma.project.create({
    data: {
      code: 'PRJ-BENCH',
      name: 'Internal R&D & Bench Training',
      clientName: 'SBI FPT Internal',
      status: 'ACTIVE',
      budgetHours: 600,
      billingType: 'FIXED_PRICE',
    },
  });

  // 4. Assign Project Members
  console.log('🤝 Assigning project members...');
  const members = [
    // PRJ-SBI-CORE
    {
      projectId: prjCore.id,
      userId: userMap.get('thang.nv@sbi-fpt.com')!,
      roleInProject: 'PROJECT_MANAGER',
      allocatedPercentage: 50,
    },
    {
      projectId: prjCore.id,
      userId: userMap.get('takahashi.yuki@sbi-fpt.com')!,
      roleInProject: 'COMMUNICATOR',
      allocatedPercentage: 100,
    },
    {
      projectId: prjCore.id,
      userId: userMap.get('minh.td@sbi-fpt.com')!,
      roleInProject: 'TECH_LEAD',
      allocatedPercentage: 100,
    },
    {
      projectId: prjCore.id,
      userId: userMap.get('nam.ph@sbi-fpt.com')!,
      roleInProject: 'SENIOR_DEV',
      allocatedPercentage: 100,
    },
    {
      projectId: prjCore.id,
      userId: userMap.get('mai.lt@sbi-fpt.com')!,
      roleInProject: 'SENIOR_DEV',
      allocatedPercentage: 50,
    },
    {
      projectId: prjCore.id,
      userId: userMap.get('anh.vt@sbi-fpt.com')!,
      roleInProject: 'DEVELOPER',
      allocatedPercentage: 100,
    },
    // PRJ-SBI-NEO
    {
      projectId: prjNeo.id,
      userId: userMap.get('thang.nv@sbi-fpt.com')!,
      roleInProject: 'PROJECT_MANAGER',
      allocatedPercentage: 50,
    },
    {
      projectId: prjNeo.id,
      userId: userMap.get('bao.dq@sbi-fpt.com')!,
      roleInProject: 'TECH_LEAD',
      allocatedPercentage: 100,
    },
    {
      projectId: prjNeo.id,
      userId: userMap.get('mai.lt@sbi-fpt.com')!,
      roleInProject: 'SENIOR_DEV',
      allocatedPercentage: 50,
    },
    {
      projectId: prjNeo.id,
      userId: userMap.get('ngan.hk@sbi-fpt.com')!,
      roleInProject: 'DEVELOPER',
      allocatedPercentage: 100,
    },
  ];

  for (const m of members) {
    await prisma.projectMember.create({ data: m });
  }

  // 5. Seed 30 Days of Timesheet & ODC Badging
  console.log('⏱️ Generating 30 days of realistic timesheet and ODC badge telemetry...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // We generate data for the past 30 days
  const workDays: Date[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const dayOfWeek = d.getDay();
    // Monday(1) to Friday(5) are working days
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workDays.push(d);
    }
  }

  // Target specific dates for the 4 discrepancies
  const disc1Date = formatDate(workDays[workDays.length - 2]); // 2 days ago
  const disc2Date = formatDate(workDays[workDays.length - 3]); // 3 days ago
  const disc3Date = formatDate(workDays[workDays.length - 4]); // 4 days ago
  const disc4Date = formatDate(workDays[workDays.length - 5]); // 5 days ago

  const namId = userMap.get('nam.ph@sbi-fpt.com')!;
  const baoId = userMap.get('bao.dq@sbi-fpt.com')!;
  const anhId = userMap.get('anh.vt@sbi-fpt.com')!;
  const nganId = userMap.get('ngan.hk@sbi-fpt.com')!;
  const minhId = userMap.get('minh.td@sbi-fpt.com')!;
  const yukiId = userMap.get('takahashi.yuki@sbi-fpt.com')!;
  const maiId = userMap.get('mai.lt@sbi-fpt.com')!;
  const thangId = userMap.get('thang.nv@sbi-fpt.com')!;

  const billableStaff = [
    { id: minhId, card: 'ODC-004', prj: prjCore.id, hours: 8.0, desc: 'Core Banking API refactor' },
    { id: yukiId, card: 'ODC-003', prj: prjCore.id, hours: 8.0, desc: 'Client spec clarification & J-SOX alignment' },
    { id: namId, card: 'ODC-005', prj: prjCore.id, hours: 8.0, desc: 'Oracle to PostgreSQL transaction migration' },
    { id: anhId, card: 'ODC-008', prj: prjCore.id, hours: 8.0, desc: 'Banking batch reconciliation scripts' },
    { id: baoId, card: 'ODC-007', prj: prjNeo.id, hours: 8.0, desc: 'Securities trade order gateway microservice' },
    { id: nganId, card: 'ODC-009', prj: prjNeo.id, hours: 8.0, desc: 'Automated regression test suite execution' },
    { id: maiId, card: 'ODC-006', prj: prjCore.id, hours: 4.0, desc: 'Financial dashboard React SPA' },
    { id: maiId, card: 'ODC-006', prj: prjNeo.id, hours: 4.0, desc: 'Trade settlement UI components' },
    { id: thangId, card: 'ODC-002', prj: prjCore.id, hours: 4.0, desc: 'Project governance & sprint sync' },
    { id: thangId, card: 'ODC-002', prj: prjNeo.id, hours: 4.0, desc: 'Milestone delivery reporting' },
  ];

  for (const day of workDays) {
    const dateStr = formatDate(day);

    for (const staff of billableStaff) {
      // Check for Discrepancy 1: Nam on disc1Date -> Over-logged
      // Dev logged 9.5h in WBS, but badge swipe shows only 7.5h
      if (staff.id === namId && dateStr === disc1Date) {
        await prisma.timesheetEntry.create({
          data: {
            userId: namId,
            projectId: prjCore.id,
            date: dateStr,
            hours: 9.5,
            taskDescription: 'High-severity database deadlocks resolution & stress testing',
            taskType: 'DEV',
            isBillable: true,
            status: 'FLAGGED',
          },
        });

        const swipeIn = new Date(`${dateStr}T09:00:00Z`);
        const swipeOut = new Date(`${dateStr}T17:30:00Z`); // 7.5 physical hours
        await prisma.oDCSwipe.create({
          data: {
            userId: namId,
            odcCardId: 'ODC-005',
            swipeDate: dateStr,
            swipeIn,
            swipeOut,
            totalPhysicalHours: 7.5,
            roomCode: 'ODC-ROOM-7A',
          },
        });
        continue;
      }

      // Check for Discrepancy 2: Bao on disc2Date -> Under-logged (Revenue leakage)
      // Dev swiped 8.5h in ODC room, but only logged 4.0h in WBS
      if (staff.id === baoId && dateStr === disc2Date) {
        await prisma.timesheetEntry.create({
          data: {
            userId: baoId,
            projectId: prjNeo.id,
            date: dateStr,
            hours: 4.0,
            taskDescription: 'Partial logging: Kafka stream consumer tuning',
            taskType: 'DEV',
            isBillable: true,
            status: 'SUBMITTED',
          },
        });

        const swipeIn = new Date(`${dateStr}T08:30:00Z`);
        const swipeOut = new Date(`${dateStr}T18:00:00Z`); // 8.5 physical hours (excluding 1h lunch)
        await prisma.oDCSwipe.create({
          data: {
            userId: baoId,
            odcCardId: 'ODC-007',
            swipeDate: dateStr,
            swipeIn,
            swipeOut,
            totalPhysicalHours: 8.5,
            roomCode: 'ODC-ROOM-7B',
          },
        });
        continue;
      }

      // Check for Discrepancy 3: Anh on disc3Date -> Missing Swipe (Security violation)
      // Dev logged 8.0h on client project, but had ZERO badge swipe in ODC
      if (staff.id === anhId && dateStr === disc3Date) {
        await prisma.timesheetEntry.create({
          data: {
            userId: anhId,
            projectId: prjCore.id,
            date: dateStr,
            hours: 8.0,
            taskDescription: 'Batch processing pipeline testing (Unregistered offsite access)',
            taskType: 'DEV',
            isBillable: true,
            status: 'FLAGGED',
          },
        });
        // Deliberately DO NOT create ODCSwipe record!
        continue;
      }

      // Check for Discrepancy 4: Ngan on disc4Date -> Under-logged (Swiped 8.0h, logged 0h)
      if (staff.id === nganId && dateStr === disc4Date) {
        const swipeIn = new Date(`${dateStr}T08:30:00Z`);
        const swipeOut = new Date(`${dateStr}T17:30:00Z`);
        await prisma.oDCSwipe.create({
          data: {
            userId: nganId,
            odcCardId: 'ODC-009',
            swipeDate: dateStr,
            swipeIn,
            swipeOut,
            totalPhysicalHours: 8.0,
            roomCode: 'ODC-ROOM-7A',
          },
        });
        // Deliberately DO NOT create TimesheetEntry!
        continue;
      }

      // Standard Day: Create clean timesheet & badge entry
      await prisma.timesheetEntry.create({
        data: {
          userId: staff.id,
          projectId: staff.prj,
          date: dateStr,
          hours: staff.hours,
          taskDescription: staff.desc,
          taskType: staff.hours === 4.0 ? 'MEETING' : 'DEV',
          isBillable: true,
          status: 'APPROVED',
        },
      });

      // Avoid creating duplicate swipes for staff with split project entries (e.g. Mai, Thang)
      if (staff.id === maiId && staff.prj === prjNeo.id) continue;
      if (staff.id === thangId && staff.prj === prjNeo.id) continue;

      const swipeIn = new Date(`${dateStr}T08:30:00Z`);
      const swipeOut = new Date(`${dateStr}T17:30:00Z`);
      await prisma.oDCSwipe.create({
        data: {
          userId: staff.id,
          odcCardId: staff.card,
          swipeDate: dateStr,
          swipeIn,
          swipeOut,
          totalPhysicalHours: 8.0,
          roomCode: staff.prj === prjNeo.id ? 'ODC-ROOM-7B' : 'ODC-ROOM-7A',
        },
      });
    }
  }

  // Also add some non-billable bench & training hours on PRJ-BENCH
  console.log('📚 Adding non-billable training entries on PRJ-BENCH...');
  for (let i = 0; i < 6; i++) {
    const day = workDays[i * 3];
    if (!day) continue;
    const dateStr = formatDate(day);
    await prisma.timesheetEntry.create({
      data: {
        userId: anhId,
        projectId: prjBench.id,
        date: dateStr,
        hours: 2.0,
        taskDescription: 'FISC Banking Security Guidelines & Clean Code Workshop',
        taskType: 'ODC_SECURITY_TRAINING',
        isBillable: false,
        status: 'APPROVED',
      },
    });
  }

  // 6. Seed Cryptographic SHA-256 Audit Trail Chain
  console.log('🔒 Initializing tamper-proof cryptographic audit trail...');
  const auditEntries = [
    {
      sequence: 1,
      action: 'SYSTEM_INITIALIZATION',
      actorId: userMap.get('tanaka.kenjiro@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      details: {
        system: 'SBI FPT Innovation Platform',
        environment: 'Production-Tokyo-DC',
        fiscCompliant: true,
        jSoxStandard: 'J-SOX Section 404',
      },
    },
    {
      sequence: 2,
      action: 'CLIENT_CONTRACT_EXECUTED',
      actorId: userMap.get('tanaka.kenjiro@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 28 * 24 * 3600 * 1000),
      details: {
        client: 'SBI Shinsei Bank Tokyo',
        projectCode: 'PRJ-SBI-CORE',
        contractType: 'TIME_AND_MATERIALS',
        billingRate: 45.0,
        targetMarginPct: 60.0,
      },
    },
    {
      sequence: 3,
      action: 'ODC_ROOM_CERTIFIED',
      actorId: userMap.get('sato.haruto@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 25 * 24 * 3600 * 1000),
      details: {
        room: 'ODC-ROOM-7A',
        accessControl: 'Dual-Factor RFID + Biometric Turnstile',
        cctvCoverage: '100% Zero-Blindspot',
        airgapInspection: 'PASSED',
      },
    },
    {
      sequence: 4,
      action: 'SECURITY_BASELINE_LOCKED',
      actorId: userMap.get('sato.haruto@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      details: {
        maxDiscrepancyHoursTolerance: 0.5,
        overbillingAuditTrigger: 'IMMEDIATE_ESCALATION',
        unbilledEffortNotice: 'AUTOMATIC_REMINDER',
      },
    },
    {
      sequence: 5,
      action: 'BATCH_TIMESHEET_VERIFICATION',
      actorId: userMap.get('thang.nv@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      details: {
        period: 'Sprint 24 Bi-Weekly Effort Review',
        approvedHours: 640.0,
        flaggedHours: 0.0,
      },
    },
    {
      sequence: 6,
      action: 'ODC_DISCREPANCY_FLAGGED',
      actorId: userMap.get('sato.haruto@sbi-fpt.com')!,
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      details: {
        flaggedEmployee: 'Pham Hoang Nam',
        projectCode: 'PRJ-SBI-CORE',
        timesheetHours: 9.5,
        physicalHours: 7.5,
        violation: 'FIN-WBS-002: Over-billing risk to client',
      },
    },
  ];

  let previousHash = GENESIS_HASH;
  for (const entry of auditEntries) {
    const currentHash = computeAuditHash({
      previousHash,
      sequence: entry.sequence,
      timestamp: entry.timestamp,
      action: entry.action,
      actorId: entry.actorId,
      detailsJson: entry.details,
    });

    await prisma.auditLog.create({
      data: {
        sequence: entry.sequence,
        timestamp: entry.timestamp,
        action: entry.action,
        actorId: entry.actorId,
        detailsJson: canonicalJsonStringify(entry.details),
        previousHash,
        currentHash,
      },
    });

    previousHash = currentHash;
  }

  console.log('✅ Enterprise seeding completed successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
