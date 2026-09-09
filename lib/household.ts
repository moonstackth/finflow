import { supabase } from "./supabase";

export type Household = {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: string;
  created_at?: string;
};

export async function getOrCreateHousehold(userId: string): Promise<{ household: Household; member: HouseholdMember }> {
  if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");

  const { data: existingMember, error: memberError } = await supabase
    .from("household_members")
    .select("id, household_id, user_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) throw memberError;

  if (existingMember) {
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, name, owner_id, created_at, updated_at")
      .eq("id", existingMember.household_id)
      .single();

    if (householdError) throw householdError;
    return { household: household as Household, member: existingMember as HouseholdMember };
  }

  const { data: createdHousehold, error: createHouseholdError } = await supabase
    .from("households")
    .insert({ name: "ครอบครัวของเรา", owner_id: userId })
    .select("id, name, owner_id, created_at, updated_at")
    .single();

  if (createHouseholdError) throw createHouseholdError;

  // Existing FinFlow databases may use either lowercase or uppercase enum values.
  // Prefer the conventional lowercase value and fall back once if the enum differs.
  let memberResult = await supabase
    .from("household_members")
    .insert({ household_id: createdHousehold.id, user_id: userId, role: "owner" })
    .select("id, household_id, user_id, role, created_at")
    .single();

  if (memberResult.error) {
    memberResult = await supabase
      .from("household_members")
      .insert({ household_id: createdHousehold.id, user_id: userId, role: "OWNER" })
      .select("id, household_id, user_id, role, created_at")
      .single();
  }

  if (memberResult.error) {
    // Avoid leaving an orphan household if the member insert is rejected.
    await supabase.from("households").delete().eq("id", createdHousehold.id);
    throw memberResult.error;
  }

  return { household: createdHousehold as Household, member: memberResult.data as HouseholdMember };
}
