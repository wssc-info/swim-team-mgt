import {Column} from "@tanstack/react-table";
import {Button} from "@/components/ui/button";
import {ArrowDownAZ, ArrowDownZA, ArrowUpDown} from "lucide-react";

export const buildSort = (column: Column<any, unknown>) => {
  return <Button
    variant="ghost"
    className="px-1!"
    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  >
    {column.getIsSorted() ?
      (column.getIsSorted() === "asc" ?
        <ArrowDownAZ /> :
        <ArrowDownZA />) :
      <ArrowUpDown className="h-4 w-4"/>
    }

  </Button>;
}