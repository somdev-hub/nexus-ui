'use client';

import { ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface PreviewableAsset {
    assetId?: number;
    name?: string;
    url?: string | null;
    type?: string | null;
}

export function assetPreviewKind(a: PreviewableAsset): 'image' | 'pdf' | 'other' {
    const src = `${a.url ?? ''} ${a.name ?? ''}`.toLowerCase().split('?')[0];
    if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(src)) return 'image';
    if (/\.pdf$/.test(src)) return 'pdf';
    return 'other';
}

export function AssetPreviewDialog({
    asset,
    onClose,
}: {
    asset: PreviewableAsset | null;
    onClose: () => void;
}) {
    const kind = asset ? assetPreviewKind(asset) : 'other';
    return (
        <Dialog open={asset !== null} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="break-all">
                            {asset?.name ?? 'File preview'}
                        </span>
                        {asset?.type && (
                            <Badge variant="outline">{asset.type}</Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>
                {asset?.url &&
                    (kind === 'image' ? (
                        <img
                            src={asset.url}
                            alt={asset.name ?? 'Digital asset'}
                            className="max-h-[70vh] w-full rounded-md border object-contain"
                        />
                    ) : kind === 'pdf' ? (
                        <iframe
                            src={asset.url}
                            title={asset.name ?? 'Digital asset'}
                            className="h-[70vh] w-full rounded-md border"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                In-browser preview isn&apos;t available for this
                                file type. Open or download it instead.
                            </p>
                        </div>
                    ))}
                {asset?.url && (
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                            <a
                                href={asset.url}
                                download
                                rel="noopener noreferrer"
                            >
                                Download
                            </a>
                        </Button>
                        <Button asChild>
                            <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open in new tab
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </a>
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
