'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import type { DriverBankRecord } from '@/types/logistics-ops';
import { parseYmd, formatYmd } from '@/lib/date-utils';

// ─────────────────────────────────────────────────────────────
// HR/employee section of the driver forms: personal details +
// compensation + bank records, mirroring the HR app's
// add-employee flow (role defaults to DRIVER, no department).
// ─────────────────────────────────────────────────────────────

export interface DriverEmployeeState {
    personalEmail: string;
    address: string;
    gender: string;
    dateOfBirth: string;
    bankRecords: DriverBankRecord[];
}

export const emptyDriverEmployee: DriverEmployeeState = {
    personalEmail: '',
    address: '',
    gender: 'MALE',
    dateOfBirth: '',
    bankRecords: [],
};

export function emptyBankRecord(): DriverBankRecord {
    return {
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        accountType: 'SAVINGS',
        branchAddress: '',
    };
}

export function isBankRecordComplete(r: DriverBankRecord): boolean {
    return Boolean(
        r.bankName?.trim() &&
            r.accountHolderName?.trim() &&
            r.accountNumber?.trim() &&
            r.ifscCode?.trim()
    );
}

/**
 * Contract-driver compensation payload: drivers are contract-based and
 * paid commissions, so no salary components are sent — HR receives zeros
 * for the salary fields (it requires the compensation object) and only the
 * bank records needed for commission payouts.
 */
export function buildDriverCompensation(state: DriverEmployeeState) {
    return {
        basePay: 0,
        hra: 0,
        pf: 0,
        gratuity: 0,
        insurancePremium: 0,
        grossPay: 0,
        netPay: 0,
        annualPackage: '0.00',
        bonuses: [] as unknown[],
        deductions: [] as unknown[],
        bankRecords: state.bankRecords.filter(isBankRecordComplete),
    };
}

interface Props {
    value: DriverEmployeeState;
    onChange: (v: DriverEmployeeState) => void;
    /** True when the driver already has an IAM user (edit mode) */
    linked?: boolean;
    /** True while the IAM/HR details are being lazy-loaded */
    loading?: boolean;
}

export function DriverEmployeeFields({
    value,
    onChange,
    linked,
    loading,
}: Props) {
    const set = (patch: Partial<DriverEmployeeState>) =>
        onChange({ ...value, ...patch });

    const setBank = (i: number, patch: Partial<DriverBankRecord>) =>
        set({
            bankRecords: value.bankRecords.map((r, idx) =>
                idx === i ? { ...r, ...patch } : r
            ),
        });

    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-2">
                <Badge variant="secondary">Role: Driver</Badge>
                <span className="text-xs text-muted-foreground">
                    The driver is onboarded as an employee — a Nexus login and
                    HR record are created under the Operations department.
                </span>
            </div>

            {loading && (
                <div className="rounded-md border px-3 py-2">
                    <p className="animate-pulse text-xs text-muted-foreground">
                        Loading IAM & HR employee details…
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Personal Email</Label>
                    <Input
                        placeholder="e.g. rajesh.personal@gmail.com"
                        value={value.personalEmail}
                        onChange={(e) =>
                            set({ personalEmail: e.target.value })
                        }
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Gender</Label>
                    <Select
                        value={value.gender || 'MALE'}
                        onValueChange={(v) => set({ gender: v })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">MALE</SelectItem>
                            <SelectItem value="FEMALE">FEMALE</SelectItem>
                            <SelectItem value="OTHER">OTHER</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                    <Label>Date of Birth</Label>
                    <DatePicker
                        date={parseYmd(value.dateOfBirth)}
                        onDateChange={(d) =>
                            set({ dateOfBirth: formatYmd(d) })
                        }
                        placeholder="Pick date of birth"
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Address</Label>
                    <Input
                        placeholder="e.g. 12 MG Road, Bengaluru"
                        value={value.address}
                        onChange={(e) => set({ address: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-3">
                <div className="flex items-center justify-between">
                    <Label>Bank Details</Label>
                    {!linked && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                set({ bankRecords: [...value.bankRecords, emptyBankRecord()] })
                            }
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add bank account
                        </Button>
                    )}
                </div>
                {value.bankRecords.length === 0 && !linked && (
                    <p className="text-xs text-muted-foreground">
                        At least one bank account is required for commission
                        payouts.
                    </p>
                )}
                {value.bankRecords.length === 0 && linked && !loading && (
                    <p className="text-xs text-muted-foreground">
                        No bank records on the HR file.
                    </p>
                )}
                {linked &&
                    value.bankRecords.map((r, i) => (
                        <div
                            key={i}
                            className="grid gap-1 rounded-md border px-3 py-2 text-sm"
                        >
                            <div className="font-medium">
                                {r.bankName || '—'}{' '}
                                <span className="font-normal text-muted-foreground">
                                    · {r.accountType}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground break-all">
                                {r.accountHolderName || '—'} · a/c{' '}
                                {r.accountNumber || '—'} ·{' '}
                                {r.ifscCode || '—'}
                                {r.branchAddress ? ` · ${r.branchAddress}` : ''}
                            </div>
                        </div>
                    ))}
                {!linked &&
                    value.bankRecords.map((r, i) => (
                    <div
                        key={i}
                        className="grid gap-3 rounded-md border p-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                                Bank account {i + 1}
                                {!isBankRecordComplete(r) && (
                                    <span> · incomplete</span>
                                )}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    set({
                                        bankRecords:
                                            value.bankRecords.filter(
                                                (_, idx) => idx !== i
                                            ),
                                    })
                                }
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Bank Name</Label>
                                <Input
                                    value={r.bankName}
                                    onChange={(e) =>
                                        setBank(i, { bankName: e.target.value })
                                    }
                                    placeholder="e.g. HDFC Bank"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Account Holder</Label>
                                <Input
                                    value={r.accountHolderName}
                                    onChange={(e) =>
                                        setBank(i, {
                                            accountHolderName: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Rajesh Kumar"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="grid gap-2">
                                <Label>Account Number</Label>
                                <Input
                                    value={r.accountNumber}
                                    onChange={(e) =>
                                        setBank(i, {
                                            accountNumber: e.target.value,
                                        })
                                    }
                                    placeholder="Account number"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>IFSC Code</Label>
                                <Input
                                    value={r.ifscCode}
                                    onChange={(e) =>
                                        setBank(i, { ifscCode: e.target.value })
                                    }
                                    placeholder="e.g. HDFC0000123"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Account Type</Label>
                                <Select
                                    value={r.accountType}
                                    onValueChange={(v) =>
                                        setBank(i, {
                                            accountType: v as
                                                | 'SAVINGS'
                                                | 'CURRENT',
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SAVINGS">
                                            SAVINGS
                                        </SelectItem>
                                        <SelectItem value="CURRENT">
                                            CURRENT
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch Address</Label>
                            <Input
                                value={r.branchAddress}
                                onChange={(e) =>
                                    setBank(i, {
                                        branchAddress: e.target.value,
                                    })
                                }
                                placeholder="e.g. MG Road branch, Bengaluru"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {linked && (
                <p className="text-xs text-muted-foreground">
                    This driver already has an IAM login and HR record — saving
                    will sync the profile changes into them. Bank details are
                    managed by HR.
                </p>
            )}
        </div>
    );
}
