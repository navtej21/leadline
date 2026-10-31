import {test,expect} from "vitest";
import { normalizeDomain } from "./domain/normalize";

test("removes https://", () => {
  const result=normalizeDomain("https://zoho.com");
  expect(result).toBe("zoho.com");
});


test("remove www",()=>{
    const result=normalizeDomain("https://www.zoho.com");
    expect(result).toBe("zoho.com");
})


test("when no domain is present",()=>{

    const result=normalizeDomain("zoho.com");
    expect(result).toBe("zoho.com");
    
})