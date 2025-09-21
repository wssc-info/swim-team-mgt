import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {FilterIcon, FilterXIcon} from "lucide-react";

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