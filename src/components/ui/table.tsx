import * as React from "react";
import { cn } from "@/lib/utils";


const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div
    className="custom-scrollbar w-full overflow-x-auto"
    style={{ WebkitOverflowScrolling: 'touch' }}
  >
    <table
      className={cn(
        "w-full min-w-[600px] caption-bottom text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));

Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn("bg-transparent [&_tr]:border-b [&_tr]:border-white/10", className)} ref={ref} {...props} />
));

TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    className={cn("[&_tr:last-child]:border-0", className)}
    ref={ref}
    {...props}
  />
));

TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    className={cn(
      "border-b border-white/5 transition-colors duration-200 hover:bg-white/2",
      className
    )}
    ref={ref}
    {...props}
  />
));

TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    className={cn(
      "h-12 px-2 py-4 text-left align-middle text-[10px] font-bold tracking-wider text-foreground/40 uppercase md:px-4 md:text-[11px]",
      className
    )}
    ref={ref}
    {...props}
  />
));

TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td className={cn("px-2 py-3 align-middle text-sm text-text-primary md:px-4 md:py-4", className)} ref={ref} {...props} />
));

TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
