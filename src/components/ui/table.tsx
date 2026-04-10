import * as React from "react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto rounded-[24px] bg-white/1 px-1">
    <table className={cn("w-full caption-bottom text-sm", className)} ref={ref} {...props} />
  </div>
));

Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead className={cn("[&_tr]:border-b [&_tr]:border-border/60", className)} ref={ref} {...props} />
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
      "border-b border-border/55 transition-colors duration-150 hover:bg-surface-raised/55",
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
      "h-12 px-4 text-left align-middle text-[11px] font-medium tracking-[0.18em] text-text-secondary uppercase",
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
  <td className={cn("px-4 py-4 align-middle text-sm text-text-primary", className)} ref={ref} {...props} />
));

TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
