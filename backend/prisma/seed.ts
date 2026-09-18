import { PrismaClient, Role, DepartmentType, Severity, RequestStatus, SegmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding RailSync AI Database for Secunderabad ↔ Visakhapatnam Corridor ---');

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.train.deleteMany();
  await prisma.trackSegment.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Seed Users across all roles and departments
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Chief Controller Rajesh Sharma',
      employeeId: 'EMP-ADM-001',
      email: 'admin@railsync.ir',
      mobileNumber: '+91 98480 11001',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const enggUser = await prisma.user.create({
    data: {
      fullName: 'Sr. Section Engineer P. Venkat Reddy',
      employeeId: 'EMP-ENG-101',
      email: 'engg@railsync.ir',
      mobileNumber: '+91 98480 22002',
      passwordHash,
      role: Role.DEPARTMENT,
      department: DepartmentType.ENGINEERING,
    },
  });

  const tdUser = await prisma.user.create({
    data: {
      fullName: 'OHE Section Engineer K. Ramesh Babu',
      employeeId: 'EMP-TD-201',
      email: 'td@railsync.ir',
      mobileNumber: '+91 98480 33003',
      passwordHash,
      role: Role.DEPARTMENT,
      department: DepartmentType.TRACTION_DISTRIBUTION,
    },
  });

  const sandtUser = await prisma.user.create({
    data: {
      fullName: 'Signal Inspector S. Ananth Kumar',
      employeeId: 'EMP-SNT-301',
      email: 'sandt@railsync.ir',
      mobileNumber: '+91 98480 44004',
      passwordHash,
      role: Role.DEPARTMENT,
      department: DepartmentType.SIGNAL_TELECOM,
    },
  });

  const pilotUser = await prisma.user.create({
    data: {
      fullName: 'Chief Loco Pilot M. Srinivasa Rao',
      employeeId: 'EMP-PLT-501',
      email: 'pilot@railsync.ir',
      mobileNumber: '+91 98480 55005',
      passwordHash,
      role: Role.USER_PILOT,
    },
  });

  console.log('Seeded users: Admin, Engineering, TD, S&T, Loco Pilot');

  // 2. Seed Stations (South Central Railway -> East Coast / Waltair route)
  const stationsData = [
    { code: 'SC', name: 'Secunderabad Jn', lat: 17.4344, lon: 78.5015, type: 'junction' },
    { code: 'KZJ', name: 'Kazipet Jn', lat: 17.9782, lon: 79.5165, type: 'junction' },
    { code: 'WL', name: 'Warangal', lat: 17.9715, lon: 79.6015, type: 'station' },
    { code: 'KMT', name: 'Khammam', lat: 17.2514, lon: 80.1491, type: 'station' },
    { code: 'BZA', name: 'Vijayawada Jn', lat: 16.5186, lon: 80.6200, type: 'junction' },
    { code: 'EE', name: 'Eluru', lat: 16.7107, lon: 81.1035, type: 'station' },
    { code: 'RJY', name: 'Rajahmundry', lat: 16.9891, lon: 81.7840, type: 'station' },
    { code: 'SLO', name: 'Samalkot Jn', lat: 17.0500, lon: 82.1667, type: 'junction' },
    { code: 'DVD', name: 'Duvvada', lat: 17.7083, lon: 83.1536, type: 'station' },
    { code: 'VSKP', name: 'Visakhapatnam Jn', lat: 17.7214, lon: 83.2872, type: 'junction' },
  ];

  const stationMap: Record<string, any> = {};
  for (const s of stationsData) {
    stationMap[s.code] = await prisma.station.create({ data: s });
  }
  console.log('Seeded 10 corridor stations');

  // 3. Seed 9 Track Segments
  const segmentPairs = [
    { from: 'SC', to: 'KZJ', label: 'Secunderabad Jn–Kazipet Jn', lengthKm: 132, status: SegmentStatus.NORMAL },
    { from: 'KZJ', to: 'WL', label: 'Kazipet Jn–Warangal', lengthKm: 11, status: SegmentStatus.NORMAL },
    { from: 'WL', to: 'KMT', label: 'Warangal–Khammam', lengthKm: 108, status: SegmentStatus.NORMAL },
    { from: 'KMT', to: 'BZA', label: 'Khammam–Vijayawada Jn', lengthKm: 100, status: SegmentStatus.DISRUPTED },
    { from: 'BZA', to: 'EE', label: 'Vijayawada Jn–Eluru', lengthKm: 60, status: SegmentStatus.NORMAL },
    { from: 'EE', to: 'RJY', label: 'Eluru–Rajahmundry', lengthKm: 90, status: SegmentStatus.NORMAL },
    { from: 'RJY', to: 'SLO', label: 'Rajahmundry–Samalkot Jn', lengthKm: 50, status: SegmentStatus.OCCUPIED },
    { from: 'SLO', to: 'DVD', label: 'Samalkot Jn–Duvvada', lengthKm: 138, status: SegmentStatus.NORMAL },
    { from: 'DVD', to: 'VSKP', label: 'Duvvada–Visakhapatnam', lengthKm: 18, status: SegmentStatus.CONFLICT },
  ];

  const segmentMap: Record<string, any> = {};
  for (const seg of segmentPairs) {
    const created = await prisma.trackSegment.create({
      data: {
        fromStationId: stationMap[seg.from].id,
        toStationId: stationMap[seg.to].id,
        label: seg.label,
        status: seg.status,
        lengthKm: seg.lengthKm,
        isSingleLine: seg.from === 'DVD' && seg.to === 'VSKP',
      },
    });
    segmentMap[seg.label] = created;
  }
  console.log('Seeded 9 track segments');

  // 4. Seed 3 Active Pre-loaded Maintenance Requests
  // Request 1: Engineering defect between Rajahmundry ↔ Samalkot
  const req1 = await prisma.maintenanceRequest.create({
    data: {
      reportedById: enggUser.id,
      reportingDepartment: DepartmentType.ENGINEERING,
      requiredDepartments: [DepartmentType.ENGINEERING, DepartmentType.SIGNAL_TELECOM],
      segmentId: segmentMap['Rajahmundry–Samalkot Jn'].id,
      title: 'Track Weld Fatigue & Joint Displacement at KM 562/14',
      description: 'Ultrasonic flaw detection detected micro-fractures in rail head near fishplate joint. Needs immediate weld cutting, track renewal and signalling bond reattachment.',
      photoUrls: ['/uploads/sample-track-defect.svg'],
      observedAt: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
      estimatedDelayMinutes: 45,
      severity: Severity.HIGH,
      priorityScore: 78.5,
      status: RequestStatus.SUBMITTED,
      xaiExplanation: {
        criticalityScore: 75,
        urgencyHoursRemaining: 6,
        conflictsFound: 0,
        recommendedWindow: '11:00 - 13:30 (2.5 hrs shadow block)',
        rationale: 'High weld defect on high-speed passenger trunk route. Recommended joint block with S&T to prevent secondary signal failure.',
      },
    },
  });

  // Request 2: TD OHE Fault between Khammam ↔ Vijayawada
  const req2 = await prisma.maintenanceRequest.create({
    data: {
      reportedById: tdUser.id,
      reportingDepartment: DepartmentType.TRACTION_DISTRIBUTION,
      requiredDepartments: [DepartmentType.TRACTION_DISTRIBUTION],
      segmentId: segmentMap['Khammam–Vijayawada Jn'].id,
      title: 'OHE Catenary Wire Dropper Slack & Insulator Flashover',
      description: 'Dropper wire broken at Mast #144/22. Catenary wire experiencing abnormal sag, posing risk of pantograph entanglement on down line.',
      photoUrls: ['/uploads/sample-ohe-fault.svg'],
      observedAt: new Date(Date.now() - 3600 * 1000 * 2),
      estimatedDelayMinutes: 30,
      severity: Severity.MEDIUM,
      priorityScore: 58.0,
      status: RequestStatus.SUBMITTED,
      xaiExplanation: {
        criticalityScore: 50,
        urgencyHoursRemaining: 12,
        conflictsFound: 0,
        recommendedWindow: '14:00 - 16:00 (2 hrs power block)',
        rationale: 'Power block required on DOWN line. UP line can accommodate bi-directional single line working.',
      },
    },
  });

  // Request 3: S&T Signal Fault between Duvvada ↔ Visakhapatnam (Conflict)
  const req3 = await prisma.maintenanceRequest.create({
    data: {
      reportedById: sandtUser.id,
      reportingDepartment: DepartmentType.SIGNAL_TELECOM,
      requiredDepartments: [DepartmentType.SIGNAL_TELECOM, DepartmentType.ENGINEERING],
      segmentId: segmentMap['Duvvada–Visakhapatnam'].id,
      title: 'Point Machine 104A Failure & Axle Counter Disconnection',
      description: 'Point detection circuit failing intermittently at Duvvada yard approach. Electronic Interlocking throwing track circuit false-occupancy alarms.',
      photoUrls: ['/uploads/sample-signal-fault.svg'],
      observedAt: new Date(Date.now() - 3600 * 1000 * 1),
      estimatedDelayMinutes: 90,
      severity: Severity.CRITICAL,
      priorityScore: 92.0,
      status: RequestStatus.UNDER_REVIEW,
      xaiExplanation: {
        criticalityScore: 100,
        urgencyHoursRemaining: 2,
        conflictsFound: 1,
        collidingSlot: 'Scheduled Freight rake BoxN/CC-882 at 10:15',
        recommendedWindow: '10:30 - 12:30 (Reschedule Freight to siding)',
        rationale: 'Critical point failure halts all trains entering Visakhapatnam. Immediate coordinated S&T+Engg possession advised.',
      },
    },
  });

  console.log('Seeded 3 maintenance requests with XAI diagnostics');

  // 5. Seed Trains & assign Loco Pilot
  const train1 = await prisma.train.create({
    data: {
      number: '12728',
      name: 'Godavari Superfast Express',
      pilotUserId: pilotUser.id,
      originStationId: stationMap['SC'].id,
      destinationStationId: stationMap['VSKP'].id,
      currentSegmentId: segmentMap['Secunderabad Jn–Kazipet Jn'].id,
      status: 'on_time',
      delayMinutes: 0,
    },
  });

  const train2 = await prisma.train.create({
    data: {
      number: '12805',
      name: 'Jan Shatabdi Express',
      originStationId: stationMap['VSKP'].id,
      destinationStationId: stationMap['SC'].id,
      currentSegmentId: segmentMap['Samalkot Jn–Duvvada'].id,
      status: 'delayed',
      delayMinutes: 15,
    },
  });

  const train3 = await prisma.train.create({
    data: {
      number: '18519',
      name: 'Ratnachal Intercity Express',
      originStationId: stationMap['VSKP'].id,
      destinationStationId: stationMap['BZA'].id,
      currentSegmentId: segmentMap['Eluru–Rajahmundry'].id,
      status: 'on_time',
      delayMinutes: 0,
    },
  });

  // Update pilot's assigned train
  await prisma.user.update({
    where: { id: pilotUser.id },
    data: { assignedTrainId: train1.id },
  });

  console.log('Seeded 3 corridor trains & assigned pilot');

  // 6. Seed initial Notifications
  await prisma.notification.create({
    data: {
      userId: pilotUser.id,
      type: 'block_alert',
      message: 'Notice to Loco Pilot (Train 12727 Godavari Express): Track possession planned at Rajahmundry-Samalkot section. Proceed at caution speed.',
      relatedRequestId: req1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: enggUser.id,
      type: 'request_submitted',
      message: 'Your maintenance request #REQ-56214 (Rajahmundry-Samalkot) is logged and submitted to Chief Controller queue.',
      relatedRequestId: req1.id,
      isRead: true,
    },
  });

  // 7. Seed Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: enggUser.id,
      action: 'REQUEST_SUBMITTED',
      beforeState: {},
      afterState: { id: req1.id, severity: 'HIGH', title: req1.title },
      relatedRequestId: req1.id,
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
