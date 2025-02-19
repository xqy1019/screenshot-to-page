import { IconUpload } from '@arco-design/web-react/icon';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
// import { PromptImage } from "../../../types";
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const baseStyle = {
    flex: 1,
    width: '80%',
    margin: '0 auto',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out',
};

const focusedStyle = {
    borderColor: '#2196f3',
};

const acceptStyle = {
    borderColor: '#00e676',
};

const rejectStyle = {
    borderColor: '#ff1744',
};

// TODO: Move to a separate file
function fileToDataURL(file: File) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

type FileWithPreview = {
    preview: string;
} & File;

interface Props {
    setReferenceImages: (referenceImages: string[]) => void;
}

function ImageUpload({ setReferenceImages }: Props) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
        maxFiles: 1,
        maxSize: 1024 * 1024 * 1, // 1 MB
        accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpeg'],
            'image/jpg': ['.jpg'],
        },
        onDrop: acceptedFiles => {
            // Set up the preview thumbnail images
            setFiles(
                acceptedFiles.map((file: File) =>
                    Object.assign(file, {
                        preview: URL.createObjectURL(file),
                    })
                ) as FileWithPreview[]
            );

            // Convert images to data URLs and set the prompt images state
            Promise.all(acceptedFiles.map(file => fileToDataURL(file)))
                .then(dataUrls => {
                    setReferenceImages(dataUrls.map(dataUrl => dataUrl as string));
                })
                .catch(error => {
                    toast.error('Error reading files' + error);
                    console.error('Error reading files:', error);
                });
        },
        onDropRejected: rejectedFiles => {
            toast.error(rejectedFiles[0].errors[0].message);
        },
    });

    const pasteEvent = useCallback(
        (event: ClipboardEvent) => {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return;

            const items = clipboardData.items;
            const files = [];
            for (let i = 0; i < items.length; i++) {
                const file = items[i].getAsFile();
                if (file && file.type.startsWith('image/')) {
                    files.push(file);
                }
            }

            // Convert images to data URLs and set the prompt images state
            Promise.all(files.map(file => fileToDataURL(file)))
                .then(dataUrls => {
                    if (dataUrls.length > 0) {
                        setReferenceImages(dataUrls.map(dataUrl => dataUrl as string));
                    }
                })
                .catch(error => {
                    // TODO: Display error to user
                    console.error('Error reading files:', error);
                });
        },
        [setReferenceImages]
    );

    // TODO: Make sure we don't listen to paste events in text input components
    const event = useRef<typeof pasteEvent>();
    useEffect(() => {
        if (event.current) {
            window.removeEventListener('paste', event.current);
        }
        window.addEventListener('paste', pasteEvent);
        event.current = pasteEvent;
    }, [pasteEvent]);

    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]); // Added files as a dependency

    const style = useMemo(
        () => ({
            ...baseStyle,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
        }),
        [isFocused, isDragAccept, isDragReject]
    );
    const { t } = useTranslation('translations');
    return (
        <section className="container">
            <div {...getRootProps({ style: style as any })}>
                <input {...getInputProps()} />
                <div className="flex justify-center items-center bg-gray-100 ">
                    <div className="p-6 rounded-lg bg-white w-[300px] shadow-lg">
                        <div className="flex flex-col items-center">
                            <IconUpload
                                className="arco-icon"
                                style={{ fontSize: '50px', color: 'var(--pc)' }}
                            />
                            <p className="text-lg font-medium my-4">
                                {t('Drag and drop files or')}
                                <span className="text-blue-500 cursor-pointer">{t(' Browse')}</span>
                            </p>
                            <p className="text-sm  text-[var(--pc)]">
                                {t('Supported formats')}：JPEG、PNG、base64 ...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ImageUpload;
