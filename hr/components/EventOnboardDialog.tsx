"use client";

import { Card, CardContent } from "./ui/card";
import { Minus, PartyPopper, Plus } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "./ui/dialog";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "./ui/select";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import {
	HtmlEditorPreview,
	BOILERPLATE as HTML_BOILERPLATE
} from "./HtmlEditorPreview";
import { createEventTemplate } from "@/lib/auth-service";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "./ui/spinner";

enum ParamType {
	BODY_PARAM = "BODY_PARAM",
	TITLE_PARAM = "TITLE_PARAM"
}

interface EventParam {
	key: string;
	defaultValue: string;
	paramType: ParamType;
	isRequired: boolean;
}

const EMPTY_PAIR: EventParam = {
	key: "",
	defaultValue: "",
	paramType: ParamType.BODY_PARAM,
	isRequired: false
};

const eventParamSchema = z.object({
	key: z.string().min(1, "Parameter name is required"),
	defaultValue: z.string(),
	paramType: z.enum(["BODY_PARAM", "TITLE_PARAM"] as const),
	isRequired: z.boolean(),
});

const eventOnboardSchema = z.object({
	eventName: z.string().min(1, "Event name is required"),
	eventType: z.string().min(1, "Event type is required"),
	subject: z.string().min(1, "Subject is required"),
	params: z.array(eventParamSchema).min(1, "At least one parameter is required"),
	templateHtml: z.string().min(1, "Template HTML is required"),
});

type EventOnboardFormValues = z.infer<typeof eventOnboardSchema>;

const INITIAL_EVENT = {
	eventName: "",
	eventType: "",
	subject: "",
	params: [] as EventParam[],
	// ← initialise with boilerplate so the editor is never empty
	templateHtml: HTML_BOILERPLATE
};

const EventOnboardDialog = ({ smallButton }: { smallButton?: boolean }) => {
	const { userId, orgId } = useUserMetadata();
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState({
		saveTemplate: false,
	});

	const {
		control,
		register,
		handleSubmit,
		formState: { errors },
		reset,
		watch,
	} = useForm<EventOnboardFormValues>({
		resolver: zodResolver(eventOnboardSchema),
		defaultValues: {
			eventName: "",
			eventType: "",
			subject: "",
			params: [{ ...EMPTY_PAIR }],
			templateHtml: HTML_BOILERPLATE,
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "params",
	});

	const watchedTemplateHtml = watch("templateHtml");

	const addPair = () =>
		append({
			key: "",
			defaultValue: "",
			paramType: ParamType.BODY_PARAM,
			isRequired: false,
		});

	const removePair = (index: number) => {
		if (fields.length === 1) {
			update(0, {
				key: "",
				defaultValue: "",
				paramType: ParamType.BODY_PARAM,
				isRequired: false,
			});
			return;
		}
		remove(index);
	};

	const updatePair = (
		index: number,
		field: keyof EventParam,
		value: string | boolean,
	) => {
		update(index, { ...fields[index], [field]: value } as EventParam);
	};

	const onClose = () => {
		setOpen(false);
		reset({
			eventName: "",
			eventType: "",
			subject: "",
			params: [{ ...EMPTY_PAIR }],
			templateHtml: HTML_BOILERPLATE,
		});
	};

	const onSubmit = async (values: EventOnboardFormValues) => {
		try {
			setLoading({ ...loading, saveTemplate: true });
			const response = await createEventTemplate({
				templateName: values.eventName,
				eventTemplateType: values.eventType,
				eventSubject: values.subject,
				orgId: Number(orgId),
				templateParams: values.params.map((param) => ({
					paramName: param.key,
					paramDefaultValue: param.defaultValue,
					templateParamType: param.paramType,
					isRequired: param.isRequired,
				})),
				templateHtml: values.templateHtml,
			});
			if (response) {
				toast({
					title: "Event Created",
					description: "The event template has been created successfully.",
					variant: "default",
				});
				onClose();
			}
		} catch (e) {
			console.error("Error submitting event data:", e);
			toast({
				title: "Error",
				description: "Failed to create event template.",
				variant: "destructive",
			});
		} finally {
			setLoading({ ...loading, saveTemplate: false });
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{smallButton ? (
				<DialogTrigger asChild>
					<Button variant="outline" size="sm" >
						Onboard Event
					</Button>
				</DialogTrigger>
			) : (
				<DialogTrigger asChild>
					<Card className="p-4 items-center justify-center gap-2 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md">
						<CardContent className="p-0 flex flex-col items-center justify-center gap-2">
							<PartyPopper />
							<p className="font-medium">Onboard Event</p>
						</CardContent>
					</Card>
				</DialogTrigger>
			)}

			<DialogContent className="max-w-6xl max-h-[90dvh] overflow-y-auto no-scrollbar">
				<DialogHeader>
					<DialogTitle>Onboard Event</DialogTitle>
					<DialogDescription>Welcome to the onboard event!</DialogDescription>
				</DialogHeader>

				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					{/* Event name + type row */}
					<div className="flex justify-between items-center gap-6 w-full">
						<div className="flex-1 space-y-3">
							<Label htmlFor="event-name">Event Name</Label>
							<Input
								id="event-name"
								placeholder="Enter event name"
								{...register("eventName")}
							/>
							{errors.eventName && (
								<p className="text-sm text-destructive">{errors.eventName.message}</p>
							)}
						</div>
						<div className="flex-1 space-y-3">
							<Label htmlFor="event-type">Event Type</Label>
							<Controller
								name="eventType"
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}>
										<SelectTrigger className="w-full mb-0">
											<SelectValue placeholder="Select event type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="EXTERNAL_MAIL_TEMPLATE">
												External Mail Template
											</SelectItem>
											<SelectItem value="INTERNAL_NOTIFICATION_TEMPLATE">
												Internal Notification Template
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.eventType && (
								<p className="text-sm text-destructive">{errors.eventType.message}</p>
							)}
						</div>
					</div>

					<div className="">
						<div className="space-y-2">
							<Label>Subject</Label>
							<Input
								placeholder="Enter the subject of the email"
								{...register("subject")}
							/>
							{errors.subject && (
								<p className="text-sm text-destructive">{errors.subject.message}</p>
							)}
						</div>
					</div>

					{/* Param pairs */}
					<div className="flex-1 space-y-3">
						<Label>Add template param pairs</Label>
						{fields.map((field, index) => (
							<div
								key={field.id}
								className="group relative rounded-md border border-border p-3 transition-colors hover:border-muted-foreground/50"
							>
								<button
									type="button"
									onClick={() => removePair(index)}
									disabled={fields.length === 1}
									aria-label="Remove row"
									className="absolute -right-2.5 -top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-destructive hover:text-destructive group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0"
								>
									<Minus className="h-3 w-3" />
								</button>

								<div className="flex flex-wrap gap-2">
									<Input
										placeholder="Param"
										{...register(`params.${index}.key`)}
										className="min-w-30 flex-1"
									/>
									<Input
										placeholder="Default Value"
										{...register(`params.${index}.defaultValue`)}
										className="min-w-30 flex-1"
									/>
									<Controller
										name={`params.${index}.paramType`}
										control={control}
										render={({ field: selectField }) => (
											<Select
												value={selectField.value}
												onValueChange={selectField.onChange}>
												<SelectTrigger className="min-w-40 flex-1">
													<SelectValue placeholder="Select parameter type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value={ParamType.BODY_PARAM}>
														Body Parameter
													</SelectItem>
													<SelectItem value={ParamType.TITLE_PARAM}>
														Title Parameter
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									/>
									<div className="flex items-center space-x-2">
										<Controller
											name={`params.${index}.isRequired`}
											control={control}
											render={({ field: switchField }) => (
												<Switch
													id={`switch-${index}`}
													checked={switchField.value}
													onCheckedChange={switchField.onChange}
												/>
											)}
										/>
										<Label htmlFor={`switch-${index}`}>Required</Label>
									</div>
								</div>

								<button
									type="button"
									onClick={addPair}
									aria-label="Add row below"
									className="absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100"
								>
									<Plus className="h-3 w-3" />
								</button>
							</div>
						))}
						{errors.params && (
							<p className="text-sm text-destructive">{errors.params.root?.message || errors.params.message}</p>
						)}
					</div>

					{/* HTML editor — controlled, pre-seeded with boilerplate */}
					<Controller
						name="templateHtml"
						control={control}
						render={({ field }) => (
							<HtmlEditorPreview
								value={field.value ?? ""}
								onChange={field.onChange}
							/>
						)}
					/>
					{errors.templateHtml && (
						<p className="text-sm text-destructive">{errors.templateHtml.message}</p>
					)}

					<div className="flex justify-end space-x-2 pt-4">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading.saveTemplate}>
							{loading.saveTemplate ? <Spinner /> : "Save"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default EventOnboardDialog;
