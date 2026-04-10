"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-border/60 bg-surface text-text-primary shadow-panel",
      className
    )}
    {...props}
  />
));

Command.displayName = CommandPrimitive.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3" cmdk-input-wrapper="">
    <Search className="h-4 w-4 shrink-0 text-text-secondary" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/70 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[320px] overflow-x-hidden overflow-y-auto", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("px-4 py-6 text-center text-sm text-text-secondary", className)}
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-2 text-text-primary **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-1 **:[[cmdk-group-heading]]:pb-2 **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:tracking-[0.2em] **:[[cmdk-group-heading]]:text-text-secondary **:[[cmdk-group-heading]]:uppercase",
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default items-center gap-3 rounded-[18px] px-3 py-3 text-sm transition-colors duration-150 outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-surface-raised/90 data-[selected=true]:text-text-primary",
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
};
