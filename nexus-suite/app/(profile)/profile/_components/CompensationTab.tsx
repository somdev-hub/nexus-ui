'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/services/user-profile-service';

type CompensationTabProps = { profile: UserProfile };

export function CompensationTab({ profile }: CompensationTabProps) {
  return (
<TabsContent value="compensation" className="mt-6 space-y-6">
					{profile.compensation ? (
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
							{/* Compensation Summary Cards */}
							<div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
								{profile.compensation.grossPay !== undefined && (
									<Card className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>Gross Pay</CardTitle>
											<CardDescription>Total earnings before deductions.</CardDescription>
										</CardHeader>
										<CardContent className="p-0">
											<p className="text-2xl font-bold">{profile.compensation.grossPay?.toLocaleString()}</p>
										</CardContent>
									</Card>
								)}
								{profile.compensation.netPay !== undefined && (
									<Card className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>Net Pay</CardTitle>
											<CardDescription>Take-home pay after deductions.</CardDescription>
										</CardHeader>
										<CardContent className="p-0">
											<p className="text-2xl font-bold text-green-600">{profile.compensation.netPay?.toLocaleString()}</p>
										</CardContent>
									</Card>
								)}
								{profile.compensation.basePay !== undefined && (
									<Card className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>Base Pay</CardTitle>
											<CardDescription>Base salary component.</CardDescription>
										</CardHeader>
										<CardContent className="p-0">
											<p className="text-2xl font-bold">{profile.compensation.basePay?.toLocaleString()}</p>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Detailed Breakdown */}
							<div className="lg:col-span-12 flex flex-col gap-6">
								<Card className="p-4 gap-2">
									<CardHeader className="p-0">
										<CardTitle>Compensation Breakdown</CardTitle>
										<CardDescription>Detailed view of your salary components.</CardDescription>
									</CardHeader>
									<CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
										{profile.compensation.hra !== undefined && (
											<div className="p-3 rounded-lg bg-muted/50 border border-border/50">
												<p className="text-xs text-muted-foreground uppercase tracking-wider">HRA</p>
												<p className="text-sm font-medium">{profile.compensation.hra?.toLocaleString()}</p>
											</div>
										)}
										{profile.compensation.pf !== undefined && (
											<div className="p-3 rounded-lg bg-muted/50 border border-border/50">
												<p className="text-xs text-muted-foreground uppercase tracking-wider">PF</p>
												<p className="text-sm font-medium">{profile.compensation.pf?.toLocaleString()}</p>
											</div>
										)}
										{profile.compensation.totalBonuses !== undefined && (
											<div className="p-3 rounded-lg bg-muted/50 border border-border/50">
												<p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bonuses</p>
												<p className="text-sm font-medium">{profile.compensation.totalBonuses?.toLocaleString()}</p>
											</div>
										)}
										{profile.compensation.totalDeductions !== undefined && (
											<div className="p-3 rounded-lg bg-muted/50 border border-border/50">
												<p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deductions</p>
												<p className="text-sm font-medium text-red-600">{profile.compensation.totalDeductions?.toLocaleString()}</p>
											</div>
										)}
										{profile.annualSalary !== undefined && (
											<div className="p-3 rounded-lg bg-muted/50 border border-border/50 md:col-span-2">
												<p className="text-xs text-muted-foreground uppercase tracking-wider">Annual Salary</p>
												<p className="text-sm font-medium">{profile.annualSalary?.toLocaleString()}</p>
											</div>
										)}
									</CardContent>
								</Card>

								{/* Bonuses */}
								{profile.compensation.bonuses && profile.compensation.bonuses.length > 0 && (
									<Card className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>Bonuses</CardTitle>
											<CardDescription>Your bonus components.</CardDescription>
										</CardHeader>
										<CardContent className="p-0 space-y-1">
											{profile.compensation.bonuses.map((bonus, idx) => (
												<div key={idx} className="flex justify-between p-2 rounded bg-muted/30">
													<span className="text-sm">{bonus.bonusName}</span>
													<span className="text-sm font-medium">{bonus.amount?.toLocaleString()}</span>
												</div>
											))}
										</CardContent>
									</Card>
								)}

								{/* Deductions */}
								{profile.compensation.deductions && profile.compensation.deductions.length > 0 && (
									<Card className="p-4 gap-2">
										<CardHeader className="p-0">
											<CardTitle>Deductions</CardTitle>
											<CardDescription>Your deduction components.</CardDescription>
										</CardHeader>
										<CardContent className="p-0 space-y-1">
											{profile.compensation.deductions.map((ded, idx) => (
												<div key={idx} className="flex justify-between p-2 rounded bg-muted/30">
													<span className="text-sm">{ded.deductionName}</span>
													<span className="text-sm font-medium text-red-600">{ded.amount?.toLocaleString()}</span>
												</div>
											))}
										</CardContent>
									</Card>
								)}
							</div>

							{/* Empty state */}
							{!profile.compensation.grossPay && !profile.compensation.netPay && !profile.compensation.basePay && (
								<div className="lg:col-span-12">
									<Card className="p-4 gap-2">
										<CardContent className="p-0 text-center">
											<p className="text-muted-foreground">No compensation data available.</p>
										</CardContent>
									</Card>
								</div>
							)}
						</div>
					) : (
						<div className="lg:col-span-12">
							<Card className="p-4 gap-2">
								<CardContent className="p-0 text-center">
									<p className="text-muted-foreground">No compensation data available.</p>
								</CardContent>
							</Card>
						</div>
					)}
				</TabsContent>
  );
}
