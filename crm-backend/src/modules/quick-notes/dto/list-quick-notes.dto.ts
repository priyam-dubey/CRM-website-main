import { IsOptional, IsUUID } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class ListQuickNotesDto extends PaginationDto {

    @IsOptional()
    @IsUUID()
    userId?: string;

}