export type ActionResult<TData = unknown> =
  | {
      status: "success";
      message: string;
      data?: TData;
    }
  | {
      status: "error";
      message: string;
    };
