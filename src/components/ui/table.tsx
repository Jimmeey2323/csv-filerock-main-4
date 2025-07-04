import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement> & {
  maxHeight?: string;
}>(({
  className,
  maxHeight,
  ...props
}, ref) => (
  <div className="relative w-full overflow-auto border border-border rounded-xl bg-card shadow-luxury" style={maxHeight ? { maxHeight } : {}}>
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({
  className,
  ...props
}, ref) => (
  <thead ref={ref} className={cn("sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm border-b-2 border-slate-700", "[&_tr]:border-b-0", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({
  className,
  ...props
}, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", "[&_tr]:transition-all [&_tr]:duration-200", "[&_tr:hover]:bg-gradient-to-r [&_tr:hover]:from-slate-50/80 [&_tr:hover]:to-white/90 [&_tr:hover]:shadow-sm", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & {
  isClickable?: boolean;
}>(({
  className,
  isClickable = false,
  ...props
}, ref) => (
  <tfoot ref={ref} className={cn("sticky bottom-0 z-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm border-t-2 border-slate-600 font-medium shadow-luxury", "[&>tr]:last:border-b-0", isClickable && "cursor-pointer hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all duration-300", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & {
  isClickable?: boolean;
  isSubtotal?: boolean;
  isGroupHeader?: boolean;
}>(({
  className,
  isClickable = false,
  isSubtotal = false,
  isGroupHeader = false,
  ...props
}, ref) => (
  <tr ref={ref} className={cn("border-b border-slate-200/30 transition-all duration-200 h-14", isClickable && "cursor-pointer hover:bg-gradient-to-r hover:from-slate-50/60 hover:to-white/80 hover:shadow-sm", isSubtotal && "bg-slate-100/80 font-medium border-slate-300/50", isGroupHeader && "bg-gradient-to-r from-slate-100/90 to-slate-50/80 font-semibold border-l-4 border-l-primary shadow-sm", className)} {...props} />
));
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | undefined;
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({
  className,
  children,
  sortable = false,
  sortDirection,
  onSort,
  ...props
}, ref) => (
  <th ref={ref} className={cn("h-14 px-6 text-left align-middle font-bold text-white text-sm tracking-wide", "[&:has([role=checkbox])]:pr-0", sortable && "cursor-pointer select-none hover:bg-gradient-to-r hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all duration-300", className)} onClick={sortable ? onSort : undefined} {...props}>
    <div className="flex items-center justify-between">
      {children}
      {sortable && (
        <div className="flex items-center ml-2">
          {sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4 animate-pulse text-blue-400" />
          ) : sortDirection === 'desc' ? (
            <ChevronDown className="h-4 w-4 animate-pulse text-blue-400" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 opacity-60 transition-opacity hover:opacity-100 text-slate-300" />
          )}
        </div>
      )}
    </div>
  </th>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({
  className,
  ...props
}, ref) => (
  <td ref={ref} className={cn("px-6 py-4 align-middle text-slate-800 font-medium", "[&:has([role=checkbox])]:pr-0", className)} {...props} />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(({
  className,
  ...props
}, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell,  };