import { FilesService } from './files.service';
export declare class FilesController {
    private readonly files;
    constructor(files: FilesService);
    list(): {
        items: never[];
        status: string;
        message: string;
    };
}
