'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
	allocateProductionOrder,
	cancelProduction,
	completeProduction,
	createProductionOrder,
	getProductionOrders,
	startProduction,
} from '@/lib/services/production-service';
import { getProducts, getProductById } from '@/lib/services/products-service';
import { getStocks } from '@/lib/services/stock-service';
import type { ProductionOrder } from '@/types/production';
import type { Product } from '@/types/products';
import { DatePicker } from '@/components/ui/date-picker';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProductionPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [orders, setOrders] = useState<ProductionOrder[]>([]);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const [productId, setProductId] = useState<string>('');
	const [quantity, setQuantity] = useState<string>('1');
	const [notes, setNotes] = useState<string>('');
	const [deadline, setDeadline] = useState<Date | undefined>(undefined);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [required, setRequired] = useState<{ materialId: number; name: string; requiredQty: number; availableQty: number }[]>([]);
	const [validationError, setValidationError] = useState<string>('');

	const load = async () => {
		setIsLoading(true);
		try {
			const [prods, ords] = await Promise.all([
				getProducts({ pageNo: 0, pageOffset: 100 }).then((r) => r.content),
				getProductionOrders(page, 20),
			]);
			setProducts(prods as Product[]);
			setOrders(ords.content ?? []);
			setTotalPages(ords.totalPages ?? 0);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Failed to load');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	useEffect(() => {
		load();
	}, [page]);

	useEffect(() => {
		if (!productId) {
			setSelectedProduct(null);
			setRequired([]);
			setValidationError('');
			return;
		}
		let active = true;
		(async () => {
			try {
				const [prod, stocksRes] = await Promise.all([
					getProductById(Number(productId)),
					getStocks({ pageNo: 0, pageOffset: 1000 }),
				]);
				if (!active) return;
				setSelectedProduct(prod);
				const stocks = stocksRes.content ?? [];
				const qty = Number(quantity) || 1;
				const req = (prod.materials ?? []).map((m) => {
					const requiredQty = (m.quantity ?? 0) * qty;
					const availableQty = stocks
						.filter((s) => s.materialId === m.materialId)
						.reduce((sum, s) => sum + (s.quantityAvailable ?? 0), 0);
					return {
						materialId: m.materialId,
						name: m.materialName ?? `Material ${m.materialId}`,
						requiredQty,
						availableQty,
					};
				});
				setRequired(req);
				const insufficient = req.find((r) => r.availableQty < r.requiredQty);
				if (insufficient) {
					setValidationError(
						`Insufficient stock for ${insufficient.name} (need ${insufficient.requiredQty}, have ${insufficient.availableQty})`
					);
				} else {
					setValidationError('');
				}
			} catch (e) {
				if (active) setValidationError(e instanceof Error ? e.message : 'Failed to compute requirements');
			}
		})();
		return () => {
			active = false;
		};
	}, [productId, quantity]);

	const create = async () => {
		if (!productId) return toast.error('Select a product');
		try {
			const deadlineStr = deadline ? deadline.toISOString().slice(0, 19).replace('T', ' ') : undefined;
			await createProductionOrder(Number(productId), Number(quantity), notes || undefined, deadlineStr);
			toast.success('Production order created');
			setOpen(false);
			setProductId('');
			setQuantity('1');
			setNotes('');
			setDeadline(undefined);
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Create failed');
		}
	};

	const act = async (fn: (id: number) => Promise<any>, id: number, msg: string) => {
		try {
			await fn(id);
			toast.success(msg);
			load();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Action failed');
		}
	};

	if (isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full" /></div>;

	return (
		<div className="flex flex-1 flex-col p-6 gap-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Production</h1>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>Create Production Order</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Production Order</DialogTitle>
						</DialogHeader>
						<div className="space-y-3">
							<div className="space-y-2">
								<Label>Product</Label>
								<Select value={productId} onValueChange={setProductId}>
									<SelectTrigger className="w-full"><SelectValue placeholder="Select product" /></SelectTrigger>
									<SelectContent>
										{products.map((p) => (
											<SelectItem key={p.productId} value={String(p.productId)}>{p.productName}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Quantity</Label>
									<Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
								</div>
								<div className="space-y-2 w-full">
									<Label>Deadline</Label>
									<DatePicker date={deadline} onDateChange={setDeadline} withTime placeholder="Pick deadline" className="w-full" />
								</div>
							</div>
							<div className="space-y-2">
								<Label>Notes</Label>
								<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
							</div>
							{required.length > 0 && (
								<div className="border rounded p-2 space-y-1">
									<div className="text-sm font-medium">Required materials</div>
									{required.map((r) => (
										<div key={r.materialId} className="flex justify-between text-xs">
											<span>{r.name}</span>
											<span>need {r.requiredQty} / have {r.availableQty}</span>
										</div>
									))}
								</div>
							)}
							{validationError && <div className="text-sm text-red-600">{validationError}</div>}
							<Button onClick={create} className="w-full" disabled={!!validationError}>Create</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
			<Card className="p-4 gap-4">
				<CardHeader className="p-0">
					<CardTitle>Production Orders</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 p-0">
					{orders.map((o) => (
						<div key={o.productionOrderId} className="border rounded p-3 flex items-center justify-between">
							<div>
								<div className="font-medium">{o.product?.name ?? 'Product'} x {o.quantity}</div>
								<div className="text-xs text-muted-foreground">Status: {o.status}</div>
								{o.deadline && <div className="text-xs">Deadline: {new Date(o.deadline).toLocaleString()}</div>}
								{o.notes && <div className="text-xs">Notes: {o.notes}</div>}
								{o.revenueAmount != null && <div className="text-xs">Revenue: {o.revenueAmount}</div>}
							</div>
							<div className="flex gap-2">
								{o.status === 'PLANNED' && <Button size="sm" onClick={() => act(allocateProductionOrder, o.productionOrderId, 'Allocated')}>Allocate</Button>}
								{o.status === 'PLANNED' && (o.materials?.length ?? 0) > 0 && <Button size="sm" onClick={() => act(startProduction, o.productionOrderId, 'Started')}>Start</Button>}
								{o.status === 'IN_PROGRESS' && <Button size="sm" onClick={() => act(completeProduction, o.productionOrderId, 'Completed')}>Complete</Button>}
								{o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && <Button size="sm" variant="outline" onClick={() => act(cancelProduction, o.productionOrderId, 'Cancelled')}>Cancel</Button>}
							</div>
						</div>
					))}
					{orders.length === 0 && <div className="text-muted-foreground">No production orders</div>}
					<div className="flex items-center justify-between">
						<Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
						<span className="text-sm">Page {page + 1} of {Math.max(1, totalPages)}</span>
						<Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}