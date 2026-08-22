"use client";

import EventOnboardDialog from "@/components/EventOnboardDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { perticularEventData } from "./event-data";
import { formatDate } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { HtmlEditorPreview } from "@/components/HtmlEditorPreview";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import {
	CreateEventTemplateResponse,
	getEventTemplateById,
	getEventTemplateByName,
	getEventTemplates,
	ShortEventTemplateResponse,
	triggerEventMail,
	updateEventTemplate,
	getEventHitsStatusWise,
	getEventHitsMonthWise,
	decrypt
} from "@/lib/auth-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogHeader,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { EventTriggerAreaChart } from "@/components/charts/event-trigger-area-chart";
import { EventStatusDonutChart } from "@/components/charts/event-status-donut-chart";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

enum ParamType {
	BODY_PARAM = "BODY_PARAM",
	TITLE_PARAM = "TITLE_PARAM",
	null = "null",
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
	isRequired: false,
};

interface TriggerParams {
	key: string;
	value: string;
}

const INITIAL_EVENT = {
	eventName: "",
	eventType: "",
	eventTemplateId: undefined as unknown as number,
	params: [] as EventParam[],
	// ← initialise with boilerplate so the editor is never empty
	templateHtml: "",
	subject: "",
};

const eventParamSchema = z.object({
	key: z.string().min(1, "Parameter name is required"),
	defaultValue: z.string(),
	paramType: z.enum(["BODY_PARAM", "TITLE_PARAM", "null"] as const),
	isRequired: z.boolean(),
});

const triggerParamSchema = z.object({
	key: z.string().min(1, "Parameter key is required"),
	value: z.string().min(1, "Parameter value is required"),
});

const onboardingFormSchema = z.object({
	eventName: z.string().min(1, "Event name is required"),
	eventType: z.string().min(1, "Event type is required"),
	eventTemplateId: z.number().nullable().optional(),
	params: z.array(eventParamSchema).min(1, "At least one parameter is required"),
	templateHtml: z.string(),
	subject: z.string().min(1, "Subject is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;
type EventParamFormValues = z.infer<typeof eventParamSchema>;
type TriggerParamFormValues = z.infer<typeof triggerParamSchema>;

export default function Onboarding() {
	const { toast } = useToast();
	const { orgId } = useUserMetadata();
	const [searchName, setSearchName] = useState("");
	const [shortEventTemplates, setShortEventTemplates] = useState<
		ShortEventTemplateResponse[]
	>([]);
	const [loading, setLoading] = useState({
		templates: false,
		particularTemplate: false,
		search: false,
		delete: false,
		update: false,
		mailTrigger: false,
	});
	const [deletion, setDeletion] = useState(false);

	const {
		control,
		register,
		handleSubmit,
		setValue,
		getValues,
		watch,
		reset,
		formState: { errors, isDirty },
	} = useForm<OnboardingFormValues>({
		resolver: zodResolver(onboardingFormSchema),
		defaultValues: {
			eventName: "",
			eventType: "",
			eventTemplateId: null,
			params: [],
			templateHtml: "",
			subject: "",
		},
	});

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: "params",
	});

	const watchedParams = watch("params");
	const watchedTemplateHtml = watch("templateHtml");
	const watchedEventName = watch("eventName");
	const watchedEventType = watch("eventType");
	const watchedSubject = watch("subject");

	const hasTemplateHtmlEdited = watchedTemplateHtml !== "";
	const isEdited = isDirty;

	const [triggerParams, setTriggerParams] = useState({
		recipientEmails: [""],
		templateName: "",
		orgId: -1,
		templateParams: [] as TriggerParams[],
	});

	const [eventHitsStatusWise, setEventHitsStatusWise] = useState<Record<string, number>>({});
	const [eventHitsMonthWise, setEventHitsMonthWise] = useState<Record<string, number>>({});

	const fetchEventHitsStatusWise = async (templateName: string) => {
		try {
			const response = await getEventHitsStatusWise(templateName, Number(orgId));
			if (response) {
				setEventHitsStatusWise(response);
			}
		} catch (error) {
			console.error("Error fetching event hits status wise:", error);
		}
	}

	const fetchEventHitsMonthWise = async (templateName: string) => {
		try {
			const response = await getEventHitsMonthWise(templateName, Number(orgId));
			if (response) {
				setEventHitsMonthWise(response);
			}
		} catch (error) {
			console.error("Error fetching event hits month wise:", error);
		}
	}

	const handleTriggerEvent = async () => {
		try {
			setLoading((prev) => ({ ...prev, mailTrigger: true }));
			if (!triggerParams.recipientEmails[0]) {
				toast({
					title: "Recipient email is required",
					description: "Please enter a recipient email address.",
					variant: "warning",
				});
				return;
			}
			if (triggerParams.templateParams.some((param) => !param.value)) {
				toast({
					title: "All parameters are required",
					description: "Please fill in all parameter values.",
					variant: "warning",
				});
				return;
			}
			const response = await triggerEventMail(triggerParams);
			if (response && response.status === 200) {
				toast({
					title: "Event triggered",
					description: "The event has been successfully triggered.",
					variant: "success",
				});
			} else {
				toast({
					title: "Error triggering event",
					description:
						"There was an error triggering the event. Please try again.",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error triggering event",
				description:
					"There was an error triggering the event. Please try again.",
				variant: "destructive",
			});
			console.error("Error triggering event:", error);
		} finally {
			setLoading((prev) => ({ ...prev, mailTrigger: false }));
		}
	};

	const addPair = () => {
		append({
			key: "",
			defaultValue: "",
			paramType: "BODY_PARAM",
			isRequired: false,
		});
	};

	const removePair = (index: number) => {
		if (fields.length === 1) {
			update(0, {
				key: "",
				defaultValue: "",
				paramType: "BODY_PARAM",
				isRequired: false,
			});
			return;
		}
		remove(index);
	};

	const updatePair = (
		index: number,
		field: keyof EventParamFormValues,
		value: string | boolean,
	) => {
		update(index, { [field]: value } as EventParamFormValues);
	};

	const handleSubmitSearchByName = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading((prev) => ({ ...prev, search: true }));
		try {
			const response = await getEventTemplateByName(searchName, Number(orgId));
			if (response) {
				setShortEventTemplates([response]);
			}
		} catch (error) {
			console.error("Error searching event template by name:", error);
		} finally {
			setLoading((prev) => ({ ...prev, search: false }));
		}
	};

	const handleSelectParticularEvent = async (templateId: number) => {
		try {
			setLoading((prev) => ({ ...prev, particularTemplate: true }));
			const response: CreateEventTemplateResponse =
				await getEventTemplateById(templateId);

			if (response) {
				const newParams = response.templateParams.map((param) => ({
					key: param?.paramName,
					defaultValue: param?.paramDefaultValue,
					paramType: param?.templateParamType as ParamType,
					isRequired: param?.isRequired,
				}));

				const formValues: OnboardingFormValues = {
					eventTemplateId: response.eventTemplateId,
					eventName: response.templateName,
					eventType: response.eventTemplateType,
					params: newParams,
					subject: response.eventSubject,
					templateHtml: "",
				};

				if (response.templateHtmlUrl) {
					const htmlResponse = await fetch(response.templateHtmlUrl);
					let htmlResponseText = await htmlResponse.text();
					if (!htmlResponseText.startsWith("<!DOCTYPE html>")) {
						htmlResponseText = await decrypt(htmlResponseText);
					}
					formValues.templateHtml = htmlResponseText;
				}

				reset(formValues);
				setTriggerParams((prev) => ({
					...prev,
					templateName: response.templateName,
					orgId: Number(orgId),
				}));
			}

			fetchEventHitsStatusWise(response.templateName);
			fetchEventHitsMonthWise(response.templateName);
		} catch (error) {
			console.error("Error fetching event template by ID:", error);
		} finally {
			setLoading((prev) => ({ ...prev, particularTemplate: false }));
		}
	};

	const handleTemplateDelete = async () => {
		try {
			setLoading((prev) => ({ ...prev, delete: true }));
			const values = getValues();
			const response = await updateEventTemplate(false, {
				eventTemplateId: values.eventTemplateId ?? undefined,
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
				isActive: false,
			});
			if (response) {
				reset({
					eventName: "",
					eventType: "",
					eventTemplateId: null,
					params: [],
					templateHtml: "",
					subject: "",
				});
				fetchEventTemplates();
				toast({
					title: "Template deleted",
					description: "The event template has been successfully deleted.",
					variant: "default",
				});
			}
		} catch (error) {
			toast({
				title: "Error deleting template",
				description:
					"There was an error deleting the event template. Please try again.",
				variant: "destructive",
			});
			console.error("Error updating event template:", error);
		} finally {
			setLoading((prev) => ({ ...prev, delete: false }));
		}
	};

	const handleTemplateUpdate = async () => {
		try {
			setLoading((prev) => ({ ...prev, update: true }));
			const values = getValues();
			const response = await updateEventTemplate(
				values.templateHtml !== "",
				{
					eventTemplateId: values.eventTemplateId ?? undefined,
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
					isActive: true,
				},
			);
			if (response) {
				toast({
					title: "Template updated",
					description: "The event template has been successfully updated.",
					variant: "default",
				});
			}
		} catch (error) {
			toast({
				title: "Error updating template",
				description:
					"There was an error updating the event template. Please try again.",
				variant: "destructive",
			});
			console.error("Error updating event template:", error);
		} finally {
			setLoading((prev) => ({ ...prev, update: false }));
		}
	};

	const fetchEventTemplates = useCallback(async () => {
		try {
			if (!orgId) return;
			setLoading((prev) => ({ ...prev, templates: true }));
			const response = await getEventTemplates(Number(orgId));
			if (response) {
				response?.sort((a, b) => a.eventTemplateId - b.eventTemplateId);
				setShortEventTemplates(response);
			}
		} catch (error) {
			console.error("Error fetching event templates:", error);
		} finally {
			setLoading((prev) => ({ ...prev, templates: false }));
		}
	}, [orgId]);

	useEffect(() => {
		fetchEventTemplates();
	}, [fetchEventTemplates, orgId]);

	const dummyUpdate = () => {
		setLoading((prev) => ({ ...prev, update: true }));
		setTimeout(() => {
			setLoading((prev) => ({ ...prev, update: false }));
			toast({
				title: "Template updated",
				description: "The event template has been successfully updated.",
				variant: "destructive",
			});
		}, 1000);
	};

	return (
		<div className="space-y-6 p-6">
			<section className="space-y-3 flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Event Onboarding</h1>
					<p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
						Create and manage event templates for emails and internal
						communications.
					</p>
				</div>
				<EventOnboardDialog smallButton={true} />
			</section>
			<section>
				<Card className="p-4">
					<form
						action=""
						className=" flex justify-between items-end gap-2"
						onSubmit={handleSubmitSearchByName}>
						<div className="space-y-4 w-[90%]">
							<Label>Search for Event Templates</Label>
							<Input
								type="text"
								placeholder="Search by event name, type, or other criteria"
								value={searchName}
								onChange={(e) => setSearchName(e.target.value)}
							/>
						</div>
						<div className="w-[10%]">
							<Button className="w-full" type="submit">
								Search
							</Button>
						</div>
					</form>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Template ID</TableHead>
								<TableHead>Event Name</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead>Updated At</TableHead>
								<TableHead>Event Type</TableHead>
								<TableHead>No. of Params</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{shortEventTemplates &&
								shortEventTemplates.length > 0 &&
								shortEventTemplates?.map((data) => (
									<TableRow
										key={data.eventTemplateId}
										className="cursor-pointer hover:bg-muted"
										onClick={() =>
											handleSelectParticularEvent(data.eventTemplateId)
										}>
										<TableCell className="font-medium">
											{data.eventTemplateId}
										</TableCell>
										<TableCell>{data.templateName}</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(data.createdAt)}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{formatDate(data.updatedAt)}
										</TableCell>
										<TableCell>
											{data.eventTemplateType === "EXTERNAL_MAIL_EVENT" ? (
												<Badge variant="outline">External Mail Event</Badge>
											) : (
												<Badge variant="outline">Internal Event</Badge>
											)}
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{data.numberOfParams}
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</Card>
			</section>

			{(watchedEventName || watchedEventType || watchedSubject) && (
				<section>
					<Card className="p-4 gap-2">
						<CardHeader className="p-0">
							<CardTitle>Event stats</CardTitle>
							<CardDescription>
								View the statistics of the event template.
							</CardDescription>
						</CardHeader>
						<CardContent className="p-0 mt-4">
							<div className="flex item-center justify-between gap-4">
								<div className="flex-1">
									<EventTriggerAreaChart data={eventHitsMonthWise} />
								</div>
								<div className="flex-1">
									<EventStatusDonutChart data={eventHitsStatusWise} />
								</div>
							</div>
						</CardContent>
					</Card>
				</section>
			)}

			{(watchedEventName || watchedEventType || watchedSubject) && (
				<section>
					<Card className="p-4 gap-2">
						<h3 className="font-semibold m-0">Test event template</h3>
						<p className="text-sm text-muted-foreground m-0">
							Test the event template by sending a test email or notification to
							yourself. This allows you to preview how the template will appear
							to recipients and verify that all dynamic parameters are correctly
							populated.
						</p>
						{/* add email id to test */}
						<div className="flex gap-2 mt-2">
							<Input
								type="email"
								placeholder="Enter your email address"
								className="flex-1"
								value={triggerParams.recipientEmails[0]}
								onChange={(e) =>
									setTriggerParams({
										...triggerParams,
										recipientEmails: [e.target.value],
									})
								}
							/>
							<Button onClick={handleTriggerEvent} disabled={loading.mailTrigger}>
								{loading.mailTrigger ? <Spinner /> : "Send Test"}
							</Button>
						</div>
						{/* fill the params */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
							{fields.map((field, index) => (
								<div key={index} className="flex flex-col gap-4">
									<Label>{field.key || `Param ${index + 1}`}</Label>
									<Input
										type="text"
										placeholder={`Enter value for ${field.key || `Param ${index + 1}`}`}
										className="flex-1 p-2"
										value={triggerParams.templateParams[index]?.value || ""}
										onChange={(e) => {
											const newParams = [...triggerParams.templateParams];
											newParams[index] = {
												key: field.key,
												value: e.target.value,
											};
											setTriggerParams({
												...triggerParams,
												templateParams: newParams,
											});
										}}
									/>
								</div>
							))}
						</div>
					</Card>
				</section>
			)}

			{(watchedEventName || watchedEventType || watchedSubject) ? (
				<section>
					<Card className="p-4">
						<h3 className=" font-semibold ">Event Template Details</h3>
						{/* template name */}
						<div className="grid md:grid-cols-2 gap-4 ">
							<div className="space-y-2">
								<Label>Template Name</Label>
								<Input
									{...register("eventName")}
									placeholder="Enter template name"
								/>
								{errors.eventName && (
									<p className="text-sm text-destructive">{errors.eventName.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label>Event Type</Label>
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
									{...register("subject")}
									placeholder="Enter the subject of the email"
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
									className="group relative rounded-md border border-border p-3 transition-colors hover:border-muted-foreground/50">
									<button
										type="button"
										onClick={() => removePair(index)}
										disabled={fields.length === 1}
										aria-label="Remove row"
										className="absolute -right-2.5 -top-2.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-destructive hover:text-destructive group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0">
										<Minus className="h-3 w-3" />
									</button>

									<div className="flex flex-wrap gap-2">
										<Input
											placeholder="Param"
											value={field.key}
											className="min-w-30 flex-1"
											onChange={(e) => updatePair(index, "key", e.target.value)}
										/>
										<Input
											placeholder="Default Value"
											value={field.defaultValue}
											className="min-w-30 flex-1"
											onChange={(e) =>
												updatePair(index, "defaultValue", e.target.value)
											}
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
										className="absolute -bottom-2.5 left-1/2 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm opacity-0 transition-opacity hover:border-primary hover:text-primary group-hover:opacity-100">
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
						<div className="flex gap-4 justify-end mt-2 items-center">
							<Button variant="destructive" onClick={() => setDeletion(true)}>
								Delete template
							</Button>
							<Button
								disabled={!isEdited || loading.update}
								onClick={handleTemplateUpdate}>
								{loading.update ? <Spinner /> : "Update template"}
							</Button>
						</div>
					</Card>
				</section>
			) : loading.particularTemplate ? (
				<SkeletonEventTemplateCard />
			) : (
				<div className="flex items-center justify-center h-40">
					<p className="text-muted-foreground">
						Select an event template to view details
					</p>
				</div>
			)}
			<AlertDialog open={deletion} onOpenChange={setDeletion}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will delete the event template and all associated data. This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={loading.delete}
							onClick={async () => {
								await handleTemplateDelete();
								setDeletion(false);
							}}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

const SkeletonEventTemplateCard = () => (
	<Card className="p-4 animate-pulse">
		<Skeleton className="h-4 bg-muted rounded w-1/3 mb-2"></Skeleton>
		<Skeleton className="h-3 bg-muted rounded w-1/2 mb-1"></Skeleton>
		<Skeleton className="h-3 bg-muted rounded w-1/4 mb-1"></Skeleton>
		<Skeleton className="h-3 bg-muted rounded w-1/5"></Skeleton>
	</Card>
);
