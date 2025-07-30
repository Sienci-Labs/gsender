import { useTypedSelector } from 'app/hooks/useTypedSelector';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'app/components/shadcn/Table';

const FileExplorer = () => {
    const files = useTypedSelector((state) => state.controller.sdcard.files);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {files.map((file) => (
                    <TableRow key={file.fileName}>
                        <TableCell>{file.fileName}</TableCell>
                        <TableCell>{file.fileSize}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default FileExplorer;
