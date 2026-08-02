import { PartialType } from '@nestjs/swagger';
import { CreateWorkOrderMaterialDto } from './create-work-order-material.dto';

export class UpdateWorkOrderMaterialDto extends PartialType(
  CreateWorkOrderMaterialDto,
) {}
