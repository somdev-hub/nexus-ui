"use client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDeliveryAppointments } from "@/lib/services/delivery-appointment-service";
import type { DeliveryAppointment } from "@/types/delivery-appointment";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COLOR: Record<string,string> = { SCHEDULED:"bg-blue-100 text-blue-800", CONFIRMED:"bg-indigo-100 text-indigo-800", IN_PROGRESS:"bg-yellow-100 text-yellow-800", COMPLETED:"bg-green-100 text-green-800", CANCELLED:"bg-gray-100 text-gray-600", MISSED:"bg-red-100 text-red-800", RESCHEDULED:"bg-orange-100 text-orange-800" };

export default function DeliveryAppointmentsPage(){
  const [data,setData]=useState<DeliveryAppointment[]>([]);
  const [isLoading,setIsLoading]=useState(true);
  useEffect(()=>{
    let a=true;
    (async()=>{
      try{ const r=await getDeliveryAppointments({pageNo:0,pageOffset:20}); if(!a) return; setData(r.content); }catch(e){toast.error(e instanceof Error?e.message:"Failed");}
      finally{ if(a) setIsLoading(false); }
    })();
    return()=>{a=false;};
  },[]);
  if(isLoading) return <div className="p-6"><Skeleton className="h-[400px] w-full"/></div>;
  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div><h1 className="text-2xl font-bold">Delivery Appointments</h1><p className="text-muted-foreground">Warehouse receiving slots · FR-RET-034</p></div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted"><TableRow><TableHead>Appointment #</TableHead><TableHead>Shipment</TableHead><TableHead>Warehouse</TableHead><TableHead>Status</TableHead><TableHead>Scheduled</TableHead><TableHead>Dock</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(a=>(
              <TableRow key={a.appointmentId}>
                <TableCell className="font-mono">{a.appointmentNumber}</TableCell>
                <TableCell>{a.shipmentNumber || a.shipmentId || "—"}</TableCell>
                <TableCell>{a.warehouseCode || a.warehouseId}</TableCell>
                <TableCell><Badge className={COLOR[a.status]}>{a.status}</Badge></TableCell>
                <TableCell>{new Date(a.scheduledStart).toLocaleString()} → {new Date(a.scheduledEnd).toLocaleTimeString()}</TableCell>
                <TableCell>{a.dockNumber || "—"}</TableCell>
              </TableRow>
            ))}
            {data.length===0 && <TableRow><TableCell colSpan={6} className="text-center py-8">No appointments</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
