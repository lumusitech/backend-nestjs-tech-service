import { DataSource } from 'typeorm';
import { WorkOrderMaterial } from '../../work-orders/entities/work-order-material.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

interface MaterialSeed {
  description: string;
  quantity: number;
  unitCost: number;
  trackingCode: string;
  supplierEmail: string | undefined;
}

const MATERIALS: MaterialSeed[] = [
  { description: 'SSD Kingston 480GB A400', quantity: 1, unitCost: 35000, trackingCode: 'TS-PC0001', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Pasta térmica Arctic MX-4 4g', quantity: 1, unitCost: 3500, trackingCode: 'TS-PC0001', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Display LCD 15.6" HP Pavilion', quantity: 1, unitCost: 85000, trackingCode: 'TS-NB0002', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Cable UTP Cat6 exterior 100m', quantity: 2, unitCost: 18000, trackingCode: 'TS-CAM003', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Cámara Hikvision DS-2CD2047G2-LU 4MP', quantity: 6, unitCost: 65000, trackingCode: 'TS-CAM003', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'DVR Hikvision DS-7608NI-K2 8 canales', quantity: 1, unitCost: 120000, trackingCode: 'TS-CAM003', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'Disco HDD WD Purple 2TB', quantity: 1, unitCost: 55000, trackingCode: 'TS-CAM003', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'Fuente de alimentación TV LED 24"', quantity: 1, unitCost: 15000, trackingCode: 'TS-TV0004', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Cable eléctrico 2.5mm negro x 100m', quantity: 1, unitCost: 42000, trackingCode: 'TS-EL0005', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Cinta aisladora 3M Super 33+', quantity: 3, unitCost: 2500, trackingCode: 'TS-EL0005', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Access Point Ubiquiti U6 Lite', quantity: 1, unitCost: 95000, trackingCode: 'TS-WF0006', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Cable UTP Cat6 azul 305m', quantity: 1, unitCost: 65000, trackingCode: 'TS-WF0006', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Conector RJ45 Cat6 (pack 100)', quantity: 1, unitCost: 8500, trackingCode: 'TS-WF0006', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Fuente ATX 650W 80+ Bronze', quantity: 1, unitCost: 52000, trackingCode: 'TS-PC0008', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Router WiFi 6 TP-Link AX73', quantity: 1, unitCost: 78000, trackingCode: 'TS-WF0010', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Nodo mesh TP-Link Deco X60 (pack 2)', quantity: 2, unitCost: 95000, trackingCode: 'TS-WF0010', supplierEmail: 'pedidos@cablesyredes.com.ar' },
  { description: 'Panel LED 43" Samsung', quantity: 1, unitCost: 120000, trackingCode: 'TS-TV0011', supplierEmail: 'ventas@techparts.com.ar' },
  { description: 'Cable eléctrico 4mm rojo x 100m', quantity: 1, unitCost: 55000, trackingCode: 'TS-EL0012', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Disyuntor diferencial bipolar 25A', quantity: 1, unitCost: 12000, trackingCode: 'TS-EL0012', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Termica monopol. 16A', quantity: 1, unitCost: 5500, trackingCode: 'TS-EL0012', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Caja de empalme 10x10cm', quantity: 4, unitCost: 1800, trackingCode: 'TS-EL0012', supplierEmail: 'ventas@electrosuministros.com.ar' },
  { description: 'Cámara Hikvision DS-2CD2047G2-LU 4MP', quantity: 8, unitCost: 65000, trackingCode: 'TS-CAM013', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'DVR Hikvision DS-7608NI-K2 8 canales', quantity: 1, unitCost: 120000, trackingCode: 'TS-CAM013', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'Disco HDD WD Purple 2TB', quantity: 1, unitCost: 55000, trackingCode: 'TS-CAM013', supplierEmail: 'info@seguridadtotal.com.ar' },
  { description: 'Cable UTP Cat6 exterior 100m', quantity: 3, unitCost: 18000, trackingCode: 'TS-CAM013', supplierEmail: 'pedidos@cablesyredes.com.ar' },
];

export async function seedMaterials(dataSource: DataSource) {
  const materialRepo = dataSource.getRepository(WorkOrderMaterial);
  const workOrderRepo = dataSource.getRepository(WorkOrder);
  const supplierRepo = dataSource.getRepository(Supplier);

  for (const mat of MATERIALS) {
    const workOrder = await workOrderRepo.findOne({
      where: { trackingCode: mat.trackingCode },
    });

    if (!workOrder) {
      console.log('  Work order not found for material:', mat.trackingCode);
      continue;
    }

    const existing = await materialRepo.findOne({
      where: {
        description: mat.description,
        workOrderId: workOrder.id,
      },
    });

    if (existing) {
      console.log('  Material already exists:', mat.description, 'for', mat.trackingCode);
      continue;
    }

    let supplierId: string | undefined = undefined;
    if (mat.supplierEmail) {
      const supplier = await supplierRepo.findOne({
        where: { email: mat.supplierEmail },
      });
      if (supplier) {
        supplierId = supplier.id;
      }
    }

    const material = materialRepo.create({
      description: mat.description,
      quantity: mat.quantity,
      unitCost: mat.unitCost,
      workOrderId: workOrder.id,
      supplierId,
    });

    await materialRepo.save(material);
    console.log('  Material created:', mat.description, '-', mat.trackingCode);
  }
}
