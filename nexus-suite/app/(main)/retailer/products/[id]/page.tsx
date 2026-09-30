'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteProduct, getProductById } from '@/lib/services/products-service';
import type { Product } from '@/types/products';
import { IconEdit } from '@tabler/icons-react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';

const page = () => {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;
    const numericId = Number(productId);

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            if (!Number.isFinite(numericId)) {
                setLoadError('Invalid product id in URL');
                setIsLoading(false);
                return;
            }
            try {
                const data = await getProductById(numericId);
                if (!active) return;
                setProduct(data);
            } catch (error) {
                if (!active) return;
                console.error('Failed to fetch product:', error);
                const message =
                    (
                        error as {
                            response?: { data?: { message?: string } };
                        }
                    )?.response?.data?.message ||
                    (error instanceof Error
                        ? error.message
                        : 'Failed to load product');
                setLoadError(
                    `Could not load product #${productId}: ${message}`
                );
                toast.error('Failed to load product');
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [productId, numericId]);

    const handleDelete = async () => {
        if (
            typeof window !== 'undefined' &&
            !window.confirm('Delete this product? This cannot be undone.')
        )
            return;
        try {
            await deleteProduct(Number(productId));
            toast.success('Product deleted');
            router.push('/retailer/products');
        } catch {
            toast.error('Failed to delete product. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <Skeleton className="h-10 w-1/3" />
                <div className="flex flex-col gap-6 lg:flex-row">
                    <Skeleton className="aspect-square w-full lg:w-1/3" />
                    <Skeleton className="h-64 w-full lg:w-2/3" />
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <p className="font-medium">Product not found</p>
                {loadError && (
                    <p className="max-w-md text-sm text-muted-foreground">
                        {loadError}
                    </p>
                )}
                <div className="mt-2 flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/retailer/products')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Products
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 justify-between gap-2 p-4 md:gap-6 md:p-6 lg:flex-row">
                    <div className="">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="m-0 text-2xl font-bold">
                                {product.productName}
                            </h1>
                            <Badge
                                variant={
                                    product.isActive ? 'default' : 'secondary'
                                }
                            >
                                {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <ul className="mt-4 flex gap-4 space-y-2 text-sm text-muted-foreground">
                            <li>
                                <b>Product code</b> : {product.productCode}
                            </li>
                            <li>
                                <b>Category</b> : {product.category || '—'}
                            </li>
                            {product.sku && (
                                <li>
                                    <b>SKU</b> : {product.sku}
                                </li>
                            )}
                        </ul>
                    </div>
                    <div className="flex gap-2">
                        {/* edit and delete buttons */}
                        <Button asChild>
                            <Link href={`/retailer/products/${productId}/edit`}>
                                {/* edit icon */}
                                <IconEdit className="mr-2 size-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col gap-6 p-4 md:p-6 lg:flex-row">
                    {/* Product Images Section */}
                    <div className="w-full lg:w-1/3">
                        <ProductImages
                            productName={product.productName}
                            images={[]}
                        />
                    </div>
                    {/* Product Details Section */}
                    <div className="w-full space-y-4 lg:w-2/3">
                        <Card>
                            <div className="p-4">
                                <h2 className="mb-2 text-lg font-semibold">
                                    Description
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {product.description ||
                                        'No description provided.'}
                                </p>

                                <h2 className="mb-2 mt-6 text-lg font-semibold">
                                    Pricing
                                </h2>
                                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Unit price
                                        </dt>
                                        <dd className="font-mono font-medium">
                                            {product.currency}{' '}
                                            {product.unitPrice.toLocaleString()}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Tax rate
                                        </dt>
                                        <dd className="font-medium">
                                            {product.taxRate}%
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Currency
                                        </dt>
                                        <dd className="font-medium">
                                            {product.currency}
                                        </dd>
                                    </div>
                                </dl>

                                <h2 className="mb-2 mt-6 text-lg font-semibold">
                                    Ordering
                                </h2>
                                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Min order qty
                                        </dt>
                                        <dd className="font-medium">
                                            {product.minOrderQuantity}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Max order qty
                                        </dt>
                                        <dd className="font-medium">
                                            {product.maxOrderQuantity ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Lead time
                                        </dt>
                                        <dd className="font-medium">
                                            {product.leadTimeDays} day(s)
                                        </dd>
                                    </div>
                                </dl>

                                <h2 className="mb-2 mt-6 text-lg font-semibold">
                                    Classification
                                </h2>
                                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Category
                                        </dt>
                                        <dd className="font-medium">
                                            {product.category || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Sub category
                                        </dt>
                                        <dd className="font-medium">
                                            {product.subCategory || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Brand
                                        </dt>
                                        <dd className="font-medium">
                                            {product.brand || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Unit of measure
                                        </dt>
                                        <dd className="font-medium">
                                            {product.unitOfMeasure}
                                        </dd>
                                    </div>
                                </dl>

                                <h2 className="mb-2 mt-6 text-lg font-semibold">
                                    Physical properties
                                </h2>
                                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Weight (kg)
                                        </dt>
                                        <dd className="font-medium">
                                            {product.weight ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Dimensions (LxWxH cm)
                                        </dt>
                                        <dd className="font-medium">
                                            {product.dimensions || '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">
                                            Barcode
                                        </dt>
                                        <dd className="font-mono font-medium">
                                            {product.barcode || '—'}
                                        </dd>
                                    </div>
                                </dl>

                                {product.tags && product.tags.length > 0 && (
                                    <>
                                        <h2 className="mb-2 mt-6 text-lg font-semibold">
                                            Tags
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {product.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

// Product images — renders the carousel when images exist, otherwise a
// placeholder (the backend currently stores no product images).
const ProductImages = ({
    productName,
    images,
}: {
    productName: string;
    images: { id: number; src: string; alt: string }[];
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [emblaApi, setEmblaApi] = useState<CarouselApi>(undefined);

    if (images.length === 0) {
        return (
            <div className="flex aspect-square w-full flex-1 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center text-muted-foreground">
                    <p className="text-4xl font-bold">
                        {productName.charAt(0).toUpperCase()}
                    </p>
                    <p className="mt-2 text-sm">No images uploaded</p>
                </div>
            </div>
        );
    }

    const handleThumbnailClick = (index: number) => {
        setSelectedImageIndex(index);
        if (emblaApi) {
            emblaApi?.scrollTo(index);
        }
    };

    return (
        <div className="space-y-4">
            {/* Main Product Image Carousel */}
            <div className="relative">
                <Carousel setApi={setEmblaApi} className="w-full">
                    <CarouselContent>
                        {images.map((image) => (
                            <CarouselItem key={image.id}>
                                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                    <Image
                                        src={image.src}
                                        alt={image.alt}
                                        width={500}
                                        height={500}
                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center gap-2">
                {images.map((image, index) => (
                    <button
                        key={image.id}
                        onClick={() => handleThumbnailClick(index)}
                        className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 ${
                            index === selectedImageIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            width={80}
                            height={80}
                            className="h-full w-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default page;
