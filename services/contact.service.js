import supabase from "../config/db.js";

const identifyContact = async (email, phoneNumber) => {
  let query = supabase
    .from("Contact")
    .select("*")
    .is("deletedAt", null)
    .order("createdAt", { ascending: true });

  if (email && phoneNumber) {
    query = query.or(`email.eq.${email},phoneNumber.eq.${phoneNumber}`);
  } else if (email) {
    query = query.eq("email", email);
  } else if (phoneNumber) {
    query = query.eq("phoneNumber", phoneNumber);
  }

  const { data: matchingContacts, error: queryError } = await query;
  if (queryError) throw queryError;

  if (matchingContacts.length === 0) {
    const { data: newContact, error: insertError } = await supabase
      .from("Contact")
      .insert({ email, phoneNumber, linkPrecedence: "primary" })
      .select()
      .single();
    if (insertError) throw insertError;

    return {
      primaryContatctId: newContact.id,
      emails: [newContact.email].filter(Boolean),
      phoneNumbers: [newContact.phoneNumber].filter(Boolean),
      secondaryContactIds: [],
    };
  }

  let primaryContact = matchingContacts[0];
  const secondaryContactsToUpdate = [];

  for (const contact of matchingContacts) {
    if (
      contact.id !== primaryContact.id &&
      contact.linkPrecedence === "primary"
    ) {
      if (new Date(contact.createdAt) < new Date(primaryContact.createdAt)) {
        secondaryContactsToUpdate.push(primaryContact);
        primaryContact = contact;
      } else {
        secondaryContactsToUpdate.push(contact);
      }
    }
  }

  if (secondaryContactsToUpdate.length > 0) {
    const idsToUpdate = secondaryContactsToUpdate.map((c) => c.id);
    const { error: updateError } = await supabase
      .from("Contact")
      .update({
        linkedId: primaryContact.id,
        linkPrecedence: "secondary",
        updatedAt: new Date().toISOString(),
      })
      .in("id", idsToUpdate);
    if (updateError) throw updateError;
  }

  const { data: allRelatedContacts, error: relatedError } = await supabase
    .from("Contact")
    .select("*")
    .or(`id.eq.${primaryContact.id},linkedId.eq.${primaryContact.id}`)
    .is("deletedAt", null);
  if (relatedError) throw relatedError;

  const allEmails = new Set(
    allRelatedContacts.map((c) => c.email).filter(Boolean)
  );
  const allPhones = new Set(
    allRelatedContacts.map((c) => c.phoneNumber).filter(Boolean)
  );

  const newEmail = email && !allEmails.has(email);
  const newPhone = phoneNumber && !allPhones.has(phoneNumber);

  if (newEmail || newPhone) {
    const { data: newSecondaryContact, error: secondaryInsertError } =
      await supabase
        .from("Contact")
        .insert({
          email,
          phoneNumber,
          linkedId: primaryContact.id,
          linkPrecedence: "secondary",
        })
        .select()
        .single();
    if (secondaryInsertError) throw secondaryInsertError;
    allRelatedContacts.push(newSecondaryContact);
  }

  const emails = [
    ...new Set(allRelatedContacts.map((c) => c.email).filter(Boolean)),
  ];
  const phoneNumbers = [
    ...new Set(allRelatedContacts.map((c) => c.phoneNumber).filter(Boolean)),
  ];
  const secondaryContactIds = allRelatedContacts
    .filter((c) => c.linkPrecedence === "secondary")
    .map((c) => c.id);

  return {
    primaryContatctId: primaryContact.id,
    emails,
    phoneNumbers,
    secondaryContactIds,
  };
};

export { identifyContact };
