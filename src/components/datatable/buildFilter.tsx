import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {CircleXIcon, EraserIcon, FilterIcon, FilterXIcon, XIcon} from "lucide-react";
import {Input} from "@/components/ui/input";
import {Column} from "@tanstack/react-table";

export const buildFilter = (column: any, filters: { value: any, text: string }[]) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-1!">
          <FilterIcon className="h-2 w-2" fill={column.getFilterValue()?'#000000':'none'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filters.map((filter) => {
          return (
            <DropdownMenuCheckboxItem
              key={filter.value}
              className="capitalize"
              checked={column.getFilterValue() === filter.value}
              onCheckedChange={
                (value) => {
                  if (value) {
                    column?.setFilterValue(filter.value)
                  } else {
                    column?.setFilterValue(undefined);
                  }
                }
              }
            >
              {filter.text}
            </DropdownMenuCheckboxItem>
          );
        })
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const buildDateRangeFilter = (column: Column<any>) => {
  const filterValue = column.getFilterValue() as { from?: string; to?: string } | undefined;
  const hasFilter = filterValue?.from || filterValue?.to;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="px-1!">
          <FilterIcon className="h-2 w-2" fill={hasFilter ? '#000000' : 'none'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-2">
        <div className="flex flex-col gap-2 w-52">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-7">From</span>
            <Input
              type="date"
              className="h-7 text-xs"
              value={filterValue?.from ?? ''}
              onChange={e =>
                column.setFilterValue({ ...filterValue, from: e.target.value || undefined })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-7">To</span>
            <Input
              type="date"
              className="h-7 text-xs"
              value={filterValue?.to ?? ''}
              onChange={e =>
                column.setFilterValue({ ...filterValue, to: e.target.value || undefined })
              }
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => column.setFilterValue(undefined)}
            >
              Clear
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const buildTextFilter = (column: Column<any>, value: string, setValue: (value: string) => void) => {
  let dropdownMenuRef: any;
  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild ref={(ref) => {
        dropdownMenuRef = ref;
        return dropdownMenuRef;
      }}>
        <Button variant="ghost" className="px-1!">
          <FilterIcon className="h-2 w-2" fill={column.getFilterValue()?'#000000':'none'} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center">
          <Input
            placeholder="Type to filter..."
            // value={value || ''}
            value={(column.getFilterValue()  || '') as string}
            onChange={(e) => {
              // setValue(e.target.value);
              column?.setFilterValue(e.target.value || undefined);
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                dropdownMenuRef?.close(); // Close the dropdown menu
              }
            }}
          />
          <EraserIcon
            className="cursor-pointer"
            aria-label="Clear filter"
            color="gray"
            onClick={() => column?.setFilterValue(undefined)}></EraserIcon>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}