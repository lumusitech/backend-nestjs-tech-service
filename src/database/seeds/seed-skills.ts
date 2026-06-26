import { DataSource } from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';

const SKILLS = [
  { name: 'Network Setup', description: 'LAN/WAN configuration, routers, switches and structured cabling', category: 'networks' },
  { name: 'Camera Installation', description: 'IP camera, analog camera and NVR/DVR installation and configuration', category: 'electronics' },
  { name: 'PC Repair', description: 'Desktop and laptop hardware diagnostics and repair', category: 'hardware' },
  { name: 'Software Support', description: 'Software installation, configuration and troubleshooting', category: 'software' },
  { name: 'Electrical Work', description: 'Basic electrical tasks: outlet, switch and panel installation', category: 'electronics' },
  { name: 'Router Configuration', description: 'WiFi, mesh, VLAN and parental control router configuration', category: 'networks' },
  { name: 'Alarm Installation', description: 'Alarm system and sensor installation and configuration', category: 'electronics' },
  { name: 'Preventive Maintenance', description: 'Equipment cleaning, inspection and periodic maintenance', category: 'hardware' },
  { name: 'Software Installation', description: 'OS, office and specific software installation', category: 'software' },
  { name: 'Remote Support', description: 'Remote desktop assistance and technical support', category: 'software' },
];

export async function seedSkills(dataSource: DataSource) {
  const skillRepo = dataSource.getRepository(Skill);

  for (const skill of SKILLS) {
    const existing = await skillRepo.findOne({
      where: { name: skill.name },
    });

    if (existing) {
      console.log('  Skill already exists:', skill.name);
      continue;
    }

    const entity = skillRepo.create({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      isActive: true,
    });

    await skillRepo.save(entity);
    console.log('  Skill created:', skill.name);
  }
}
