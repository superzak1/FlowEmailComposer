public with sharing class ContactSearchController {
  @AuraEnabled(cacheable=true)
  public static List<LookupSearchResult> searchContacts(String searchTerm) {
    List<LookupSearchResult> results = new List<LookupSearchResult>();
    searchTerm = '%' + searchTerm + '%';
    try {
      for (List<Contact> contactList : [
        SELECT FirstName, LastName, Account.Name
        FROM Contact
        WHERE FirstName LIKE :searchTerm OR LastName LIKE :searchTerm OR Email LIKE :searchTerm
        ORDER BY FirstName, LastName, Email
      ]) {
        for (Contact c : contactList) {
          results.add(createSearchResult(c));
        }
      }
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
    return results;
  }

  @AuraEnabled(cacheable=true)
  public static List<LookupSearchResult> getMostRecentlyViewed() {
    List<LookupSearchResult> results = new List<LookupSearchResult>();
    try {
      for (List<Contact> contactList : [
        SELECT FirstName, LastName, Account.Name
        FROM Contact
        WHERE LastViewedDate != NULL
        ORDER BY LastViewedDate
        LIMIT 10
      ]) {
        for (Contact c : contactList) {
          results.add(createSearchResult(c));
        }
      }
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
    return results;
  }

  private static LookupSearchResult createSearchResult(Contact c) {
    LookupSearchResult res = new LookupSearchResult(
      c.Id,
      'Contact',
      'standard:contact',
      c.FirstName +
      ' ' +
      c.LastName,
      c.Account.Name
    );
    return res;
  }
}
