"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function TimePicker({
	value,
	onChange,
	placeholder = "Select time",
	disabled = false,
	className,
}: TimePickerProps) {
	const [open, setOpen] = React.useState(false);
	const [hours, setHours] = React.useState("");
	const [minutes, setMinutes] = React.useState("");
	const [period, setPeriod] = React.useState<"AM" | "PM">("AM");

	// Parse the value when it changes
	React.useEffect(() => {
		if (value) {
			const [h, m] = value.split(":");
			let hour = parseInt(h, 10);
			const minute = m;

			if (hour >= 12) {
				setPeriod("PM");
				if (hour > 12) hour -= 12;
			} else {
				setPeriod("AM");
				if (hour === 0) hour = 12;
			}

			setHours(hour.toString().padStart(2, "0"));
			setMinutes(minute);
		} else {
			setHours("");
			setMinutes("");
			setPeriod("AM");
		}
	}, [value]);

	const formatTime = () => {
		if (!hours || !minutes) return "";
		let hour = parseInt(hours, 10);
		if (period === "PM" && hour !== 12) hour += 12;
		if (period === "AM" && hour === 12) hour = 0;
		return `${hour.toString().padStart(2, "0")}:${minutes}`;
	};

	const handleHourChange = (newHours: string) => {
		if (newHours.length <= 2) {
			const num = parseInt(newHours, 10);
			if (!isNaN(num) && num >= 1 && num <= 12) {
				setHours(newHours.padStart(2, "0"));
				onChange(formatTime());
			}
		}
	};

	const handleMinuteChange = (newMinutes: string) => {
		if (newMinutes.length <= 2) {
			const num = parseInt(newMinutes, 10);
			if (!isNaN(num) && num >= 0 && num <= 59) {
				setMinutes(newMinutes.padStart(2, "0"));
				onChange(formatTime());
			}
		}
	};

	const handlePeriodChange = (newPeriod: "AM" | "PM") => {
		setPeriod(newPeriod);
		onChange(formatTime());
	};

	const handleIncrementHour = () => {
		let hour = parseInt(hours || "12", 10);
		hour = hour === 12 ? 1 : hour + 1;
		setHours(hour.toString().padStart(2, "0"));
		onChange(formatTime());
	};

	const handleDecrementHour = () => {
		let hour = parseInt(hours || "12", 10);
		hour = hour === 1 ? 12 : hour - 1;
		setHours(hour.toString().padStart(2, "0"));
		onChange(formatTime());
	};

	const handleIncrementMinute = () => {
		let minute = parseInt(minutes || "0", 10);
		minute = minute === 59 ? 0 : minute + 1;
		setMinutes(minute.toString().padStart(2, "0"));
		onChange(formatTime());
	};

	const handleDecrementMinute = () => {
		let minute = parseInt(minutes || "0", 10);
		minute = minute === 0 ? 59 : minute - 1;
		setMinutes(minute.toString().padStart(2, "0"));
		onChange(formatTime());
	};

	const handleClear = () => {
		setHours("");
		setMinutes("");
		setPeriod("AM");
		onChange("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn("w-full justify-between", className)}
				>
					<Clock className="h-4 w-4 mr-2 text-muted-foreground" />
					<span className="flex-1 text-left">
						{value ? (
							<>
								{hours}:{minutes} {period}
							</>
						) : (
							<span className="text-muted-foreground">{placeholder}</span>
						)}
					</span>
					{value && (
						<span
							className="ml-2 h-7 w-7 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleClear();
							}}
						>
							<X className="h-4 w-4" />
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" sideOffset={5}>
				<div className="p-4 space-y-4 min-w-[200px]">
					<div className="flex items-center justify-between">
						<h3 className="font-medium">Select Time</h3>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setOpen(false)}
							className="h-8 w-8"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<div className="flex items-center justify-center gap-2">
						{/* Hours */}
						<div className="flex flex-col items-center gap-1">
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-10"
								onClick={handleIncrementHour}
								disabled={disabled}
							>
								<ChevronUp className="h-4 w-4" />
							</Button>
							<Input
								type="text"
								value={hours}
								onChange={(e) => handleHourChange(e.target.value)}
								className="w-16 text-center text-lg font-medium"
								maxLength={2}
								disabled={disabled}
								placeholder="HH"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-10"
								onClick={handleDecrementHour}
								disabled={disabled}
							>
								<ChevronDown className="h-4 w-4" />
							</Button>
						</div>

						<span className="text-xl font-medium">:</span>

						{/* Minutes */}
						<div className="flex flex-col items-center gap-1">
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-10"
								onClick={handleIncrementMinute}
								disabled={disabled}
							>
								<ChevronUp className="h-4 w-4" />
							</Button>
							<Input
								type="text"
								value={minutes}
								onChange={(e) => handleMinuteChange(e.target.value)}
								className="w-16 text-center text-lg font-medium"
								maxLength={2}
								disabled={disabled}
								placeholder="MM"
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-8 w-10"
								onClick={handleDecrementMinute}
								disabled={disabled}
							>
								<ChevronDown className="h-4 w-4" />
							</Button>
						</div>

						{/* AM/PM */}
						<div className="flex flex-col items-center gap-1 ml-2">
							<Button
								type="button"
								variant={period === "AM" ? "default" : "outline"}
								size="sm"
								className="w-20"
								onClick={() => handlePeriodChange("AM")}
								disabled={disabled}
							>
								AM
							</Button>
							<Button
								type="button"
								variant={period === "PM" ? "default" : "outline"}
								size="sm"
								className="w-20"
								onClick={() => handlePeriodChange("PM")}
								disabled={disabled}
							>
								PM
							</Button>
						</div>
					</div>

				</div>
			</PopoverContent>
		</Popover>
	);
}