import { DataSource } from 'typeorm';
import { Supplier } from '../../suppliers/entities/supplier.entity';

const SUPPLIERS = [
  {
    name: 'Distribuidora TechParts',
    contact: 'Carlos López',
    phone: '+5491144442001',
    email: 'ventas@techparts.com.ar',
    address: 'Av. San Martín 1234, CABA',
    notes: 'Proveedor de discos SSD, memorias RAM y procesadores',
  },
  {
    name: 'Seguridad Total SRL',
    contact: 'María Fernández',
    phone: '+5491144442002',
    email: 'info@seguridadtotal.com.ar',
    address: 'Av. Belgrano 5678, CABA',
    notes: 'Cámaras Hikvision, DVR, cables y accesorios de seguridad',
  },
  {
    name: 'Cables y Redes SA',
    contact: 'Roberto Díaz',
    phone: '+5491144442003',
    email: 'pedidos@cablesyredes.com.ar',
    address: 'Av. Corrientes 9012, CABA',
    notes: 'Cable UTP, conectores, switchs, routers, patch panels',
  },
  {
    name: 'ElectroSuministros',
    contact: 'Laura Martínez',
    phone: '+5491144442004',
    email: 'ventas@electrosuministros.com.ar',
    address: 'Av. Rivadavia 3456, CABA',
    notes: 'Material eléctrico: cables, disyuntores, termicas, cajas',
  },
];

export async function seedSuppliers(dataSource: DataSource) {
  const supplierRepo = dataSource.getRepository(Supplier);

  for (const supplier of SUPPLIERS) {
    const existing = await supplierRepo.findOne({
      where: { email: supplier.email },
    });

    if (existing) {
      console.log('  Supplier already exists:', supplier.name);
      continue;
    }

    const entity = supplierRepo.create({
      name: supplier.name,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes,
      isActive: true,
    });

    await supplierRepo.save(entity);
    console.log('  Supplier created:', supplier.name);
  }
}
