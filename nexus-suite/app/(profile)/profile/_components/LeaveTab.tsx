'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/services/user-profile-service';

type LeaveTabProps = { profile: UserProfile };

export function LeaveTab({ profile }: LeaveTabProps) {
  return (
<TabsContent value="leave" className="mt-6 space-y-6">
					{profile.leaveRecords && profile.leaveRecords.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
							{/* Leave Summary Cards */}
							<div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
								{profile.leaveRecords.map((record, idx) => (
									<Card key={idx} className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>{record.leaveType || "Leave"}</CardTitle>
											<CardDescription>Leave balance details.</CardDescription>
										</CardHeader>
										<CardContent className="p-0 grid grid-cols-3 gap-2 text-center">
											<div>
												<p className="text-lg font-semibold">{record.totalLeaves || 0}</p>
												<p className="text-xs text-muted-foreground">Total</p>
											</div>
											<div>
												<p className="text-lg font-semibold">{record.leavesTaken || 0}</p>
												<p className="text-xs text-muted-foreground">Taken</p>
											</div>
											<div>
												<p className="text-lg font-semibold text-green-600">{record.remainingLeaves || 0}</p>
												<p className="text-xs text-muted-foreground">Remaining</p>
											</div>
										</CardContent>
									</Card>
								))}
							</div>

							{/* Leave Details */}
							<div className="lg:col-span-12">
								<Card className="p-4 gap-2">
									<CardHeader className="p-0">
										<CardTitle>Leave History</CardTitle>
										<CardDescription>Your leave records and balances.</CardDescription>
									</CardHeader>
									<CardContent className="p-0 space-y-2">
										{profile.leaveRecords.map((record, idx) => (
											<div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border/50">
												<div className="flex justify-between items-start mb-2">
													<div>
														<p className="text-sm font-medium">{record.leaveType || "Leave"}</p>
														<p className="text-xs text-muted-foreground">{record.leaveType || "-"}</p>
													</div>
													<div className="text-right">
														<p className="text-sm font-bold">{record.remainingLeaves || 0} remaining</p>
													</div>
												</div>
												<div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
													<div>
														<p className="text-xs font-medium">Total</p>
														<p className="text-sm">{record.totalLeaves || 0}</p>
													</div>
													<div>
														<p className="text-xs font-medium">Taken</p>
														<p className="text-sm">{record.leavesTaken || 0}</p>
													</div>
													<div>
														<p className="text-xs font-medium">Remaining</p>
														<p className="text-sm text-green-600">{record.remainingLeaves || 0}</p>
													</div>
												</div>
											</div>
										))}
									</CardContent>
								</Card>
							</div>
						</div>
					) : (
						<div className="lg:col-span-12">
							<Card className="p-4 gap-2">
								<CardContent className="p-0 text-center">
									<p className="text-muted-foreground">No leave records available.</p>
								</CardContent>
							</Card>
						</div>
					)}
				</TabsContent>
  );
}
