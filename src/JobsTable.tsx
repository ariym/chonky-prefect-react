import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as flowAPI from './api/tasks';

// Define the flow run type for the table
type FlowRunTableRow = {
  id: string;
  name: string;
  status: string;
  created?: string;
  updated?: string;
};

// Helper function to get status from flow run data
function getFlowRunStatus(flowRun: flowAPI.FlowRun): string {
  if (flowRun.status) {
    return flowRun.status;
  }
  return flowRun.state_name || flowRun.state_type || 'Unknown';
}

// Helper function to convert flow run data to table row format
function convertToTableRow(flowRun: flowAPI.FlowRun): FlowRunTableRow {
  // Handle cases where name might be missing or in a different field
  const name = flowRun.name || (flowRun as any).flow_name || (flowRun as any).id || 'Unnamed Flow Run';
  
  return {
    id: flowRun.id,
    name: name,
    status: getFlowRunStatus(flowRun),
    created: flowRun.created || (flowRun as any).created_at || (flowRun as any).start_time,
    updated: flowRun.updated || (flowRun as any).updated_at || (flowRun as any).end_time,
  };
}

export default function JobsTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Fetch flow runs from Prefect API
  // Flow runs represent flow executions with status information
  const { data: flowRuns, isLoading, error } = useQuery({
    queryKey: ['flow_runs'],
    queryFn: () => flowAPI.listFlowRuns(),
    retry: false,
  });

  // Use flow runs as the data source
  const dataSource = flowRuns || [];

  // Debug: log the data to see what we're getting
  React.useEffect(() => {
    console.log('Flow runs data:', flowRuns);
    console.log('Data source:', dataSource);
  }, [flowRuns, dataSource]);

  // Convert to table rows
  const tableData = useMemo(() => {
    if (!dataSource || dataSource.length === 0) {
      console.log('No data source available');
      return [];
    }
    const converted = dataSource.map(convertToTableRow);
    console.log('Converted table data:', converted);
    return converted;
  }, [dataSource]);

  // Define columns
  const columns = useMemo<ColumnDef<FlowRunTableRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Flow Run Name',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('name')}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const statusColors: Record<string, string> = {
            Completed: 'bg-green-100 text-green-800',
            Success: 'bg-green-100 text-green-800',
            Failed: 'bg-red-100 text-red-800',
            Running: 'bg-blue-100 text-blue-800',
            Pending: 'bg-yellow-100 text-yellow-800',
            Scheduled: 'bg-gray-100 text-gray-800',
            Cancelled: 'bg-gray-100 text-gray-800',
            Crashed: 'bg-red-100 text-red-800',
          };
          const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'created',
        header: 'Created',
        cell: ({ row }) => {
          const created = row.getValue('created') as string | undefined;
          if (!created) return '-';
          return new Date(created).toLocaleString();
        },
      },
      {
        accessorKey: 'updated',
        header: 'Updated',
        cell: ({ row }) => {
          const updated = row.getValue('updated') as string | undefined;
          if (!updated) return '-';
          return new Date(updated).toLocaleString();
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 text-gray-600">
        Loading flow runs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading flow runs: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Debug info - remove this in production */}
      {/* <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
        <div>Raw flow runs count: {flowRuns?.length || 0}</div>
        <div>Table data count: {tableData.length}</div>
        {flowRuns && flowRuns.length > 0 && (
          <div className="mt-2">
            <div>First flow run sample:</div>
            <pre className="text-xs overflow-auto">{JSON.stringify(flowRuns[0], null, 2)}</pre>
          </div>
        )}
      </div> */}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No flow runs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {tableData.length} flow runs
      </div>
    </div>
  );
}

