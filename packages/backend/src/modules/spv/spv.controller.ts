import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SpvService } from './spv.service';

@Controller('spv')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpvController {
  constructor(private readonly spvService: SpvService) {}

  @Post()
  @Roles(Role.ADMIN, Role.ISSUER)
  async create(@Body() createSpvDto: any) {
    return this.spvService.create(createSpvDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.spvService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.spvService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ISSUER)
  async update(@Param('id') id: string, @Body() updateSpvDto: any) {
    return this.spvService.update(id, updateSpvDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.spvService.remove(id);
  }

  @Get(':id/properties')
  async getProperties(@Param('id') id: string) {
    return this.spvService.getProperties(id);
  }

  @Post(':id/properties')
  @Roles(Role.ADMIN, Role.ISSUER)
  async addProperty(@Param('id') id: string, @Body() propertyDto: any) {
    return this.spvService.addProperty(id, propertyDto);
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return this.spvService.getDocuments(id);
  }

  @Post(':id/valuations')
  @Roles(Role.ADMIN, Role.ISSUER)
  async addValuation(@Param('id') id: string, @Body() valuationDto: any) {
    return this.spvService.addValuation(id, valuationDto);
  }
}
